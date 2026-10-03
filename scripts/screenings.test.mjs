import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { domainModels } from '../apps/api/dist/persistence/models.js';
import { provisionDemo, demoEmails } from '../apps/api/dist/auth/provision.js';
import { loadCatalog, catalogAreas } from '../apps/api/dist/screenings/catalog.js';
import { evaluate } from '../apps/api/dist/candidate/evaluation.js';

const database = `screeningroom_demo_test_${randomUUID().replaceAll('-', '')}`;
const passwords = [randomBytes(24).toString('base64url'), randomBytes(24).toString('base64url')];
let connection, models, server, origin, apiUri, accounts, temporary;
const request = (path, account = accounts[0], method = 'GET', body, extra = {}) => fetch(`${origin}/api${path}`, {
  method, headers: { Cookie: account.cookie, Origin: origin, 'X-CSRF-Token': account.csrfToken, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
async function result(response, status) { assert.equal(response.status, status); return response.json(); }
async function create(config = {}) { return result(await request('/screenings', accounts[0], 'POST', config), 201); }
const valid = () => ({ title: 'Screening de prueba', area: 'Tecnología', description: 'Vacante ficticia', threshold: 70,
  questions: [{ id: 'experience', criterion: 'Experiencia declarada', text: '¿Usaste control de versiones?', type: 'boolean', required: true, scored: true, weight: 3,
    options: [{ id: 'yes', label: 'Sí', score: 100 }, { id: 'no', label: 'No', score: 0 }], exclusion: { acceptedOptionIds: ['yes'] } },
  { id: 'example', criterion: 'Ejemplo', text: 'Describí un ejemplo ficticio.', type: 'text', required: false, scored: false, options: [] }] });
const publish = (id, revision = 0) => request(`/screenings/${id}/publish`, accounts[0], 'POST', { expectedRevision: revision, confirmConfiguration: true });
const save = (id, config, revision = 0) => request(`/screenings/${id}`, accounts[0], 'PUT', { ...config, expectedRevision: revision });
const catalog = () => ({ review: { status: 'approved', reviewer: 'Prueba aislada de contrato', reviewedAt: '2026-09-27T00:00:00.000Z' },
  questions: Array.from({ length: 15 }, (_, n) => ({ _id: `6700000000000000000000${(n + 1).toString(16).padStart(2, '0')}`, area: catalogAreas[Math.floor(n / 5)],
    criterion: `Criterio ficticio ${n + 1}`, text: `Pregunta ficticia ${n + 1}: ¿realizaste esta tarea?`, type: 'boolean',
    options: [{ id: 'yes', label: 'Sí' }, { id: 'no', label: 'No' }], guidance: 'Orientación ficticia de prueba; sin puntajes aprobados.', active: true })) });

before(async () => {
  const parsed = new URL(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom'); parsed.pathname = `/${database}`; apiUri = parsed.toString();
  connection = await mongoose.createConnection(apiUri, { serverSelectionTimeoutMS: 3000 }).asPromise(); models = domainModels(connection);
  await provisionDemo(connection, passwords);
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve)); origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['apps/api/dist/main.js'], { env: { ...process.env, MONGODB_URI: apiUri, API_PORT: String(port),
    PUBLIC_ORIGIN: origin, SESSION_SECRET: randomBytes(32).toString('base64url'), NODE_ENV: 'test' }, stdio: 'ignore' });
  let ready = false;
  for (let n = 0; n < 50; n++) { if (server.exitCode !== null) throw new Error('API de prueba no inició.'); try { if ((await fetch(`${origin}/api/health/ready`)).ok) { ready = true; break; } } catch { /* bounded startup */ } await delay(100); }
  assert.ok(ready);
  accounts = [];
  for (let n = 0; n < 2; n++) {
    const csrf = await fetch(`${origin}/api/auth/csrf`); const token = (await csrf.json()).csrfToken;
    const response = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin,
      Cookie: csrf.headers.getSetCookie()[0].split(';')[0], 'X-CSRF-Token': token }, body: JSON.stringify({ email: demoEmails[n], password: passwords[n] }) });
    const data = await result(response, 200);
    accounts.push({ ...data, cookie: response.headers.getSetCookie().find((value) => value.startsWith('sr_recruiter_session=')).split(';')[0] });
  }
  temporary = await mkdtemp(join(tmpdir(), 'screeningroom-catalog-test-'));
});
after(async () => {
  if (server && server.exitCode === null) { const ended = once(server, 'exit'); server.kill('SIGTERM'); const timer = setTimeout(() => server.kill('SIGKILL'), 4000); await ended; clearTimeout(timer); }
  if (connection) { assert.equal(connection.name, database); try { await connection.dropDatabase(); } finally { await connection.close(); } }
  if (temporary) await rm(temporary, { recursive: true });
});

test('crear y guardar borrador incompleto conserva identidad/metadata al releer', async () => {
  const draft = await create(); assert.equal(draft.status, 'draft'); assert.equal(draft.revision, 0); assert.deepEqual(draft.questions, []); assert.equal('ownerId' in draft, false);
  const updated = await result(await save(draft.id, { title: 'Pendiente', questions: [{ id: 'q', type: 'boolean', options: [{ id: 'a', label: 'Sí' }, { id: 'b', label: 'No' }] }] }), 200);
  assert.equal(updated.revision, 1); assert.equal(updated.questions[0].scored, false); assert.equal('threshold' in updated, false);
  const reloaded = await result(await request(`/screenings/${draft.id}`), 200); assert.deepEqual(reloaded, updated);
  assert.equal((await publish(draft.id, 1)).status, 422); assert.equal((await models.Screening.findById(draft.id)).status, 'draft');
});
test('eliminar borrador requiere propiedad y revisión actual; un publicado se conserva', async () => {
  const draft = await create();
  const path = `/screenings/${draft.id}`;
  assert.equal((await request(path, accounts[1], 'DELETE', { expectedRevision: 0 })).status, 404);
  assert.equal((await request(path, accounts[0], 'DELETE', { expectedRevision: 1 })).status, 409);
  assert.equal((await request(path, accounts[0], 'DELETE', { expectedRevision: 0 }, { 'X-CSRF-Token': '' })).status, 403);
  assert.equal((await request(path, accounts[0], 'DELETE', { expectedRevision: 0 })).status, 204);
  assert.equal((await request(path)).status, 404);
  const published = await create(valid());
  await result(await publish(published.id), 200);
  assert.equal((await request(`/screenings/${published.id}`, accounts[0], 'DELETE', { expectedRevision: 1 })).status, 409);
  assert.ok(await models.Screening.findById(published.id));
});
test('input no se coacciona y campos de propietario/estado/revisión no se pueden falsificar', async () => {
  const draft = await create();
  const invalids = [{ ownerId: accounts[1].user.id }, { status: 'published' }, { publishedAt: new Date().toISOString() }, { revision: 99 },
    { title: 'x'.repeat(121) }, { threshold: '70' }, { threshold: null }, { threshold: 70.1 }, { expectedRevision: '0' },
    { questions: Array.from({ length: 21 }, (_, n) => ({ id: `q${n}`, type: 'text' })) },
    { questions: [{ id: 'q', type: 'text' }, { id: 'q', type: 'text' }] },
    { questions: [{ id: 'q', type: { toString: 'invalid' } }] },
    { questions: [{ ...valid().questions[0], weight: 0 }] }, { questions: [{ ...valid().questions[0], required: 'true' }] },
    { questions: [{ ...valid().questions[0], options: [{ id: 'a', label: 'Sí', score: '100' }] }] },
    { questions: [{ ...valid().questions[0], options: Array.from({ length: 9 }, (_, n) => ({ id: `o${n}`, label: `Opción ${n}` })) }] },
    { questions: [{ ...valid().questions[0], bankQuestionId: new mongoose.Types.ObjectId().toString() }] }];
  for (const payload of invalids) assert.equal((await request(`/screenings/${draft.id}`, accounts[0], 'PUT', { expectedRevision: 0, ...payload })).status, 422);
  assert.equal((await models.Screening.findById(draft.id)).revision, 0);
  assert.equal((await request('/screenings', accounts[0], 'POST', { ownerId: accounts[1].user.id })).status, 422);
});
test('omitir campos en reemplazo completo los limpia sin convertir ausencia en cero', async () => {
  const draft = await create(valid()); const updated = await result(await save(draft.id, { questions: [] }), 200);
  for (const field of ['title', 'area', 'description', 'threshold']) assert.equal(field in updated, false);
  assert.equal(updated.revision, 1);
});
test('ownership y CSRF/origen se aplican a todas las nuevas mutaciones', async () => {
  const draft = await create(valid());
  for (const id of [draft.id, new mongoose.Types.ObjectId().toString(), 'invalid']) {
    for (const [suffix, method, body] of [['', 'PUT', { ...valid(), expectedRevision: 0 }], ['/publish', 'POST', { expectedRevision: 0, confirmConfiguration: true }],
      ['/copy', 'POST', {}], ['/questions/from-bank', 'POST', { expectedRevision: 0, bankQuestionId: new mongoose.Types.ObjectId().toString() }]]) {
      assert.equal((await request(`/screenings/${id}${suffix}`, accounts[1], method, body)).status, 404);
    }
  }
  for (const headers of [{ 'X-CSRF-Token': '' }, { Origin: 'https://foreign.example' }]) {
    for (const [path, method, body] of [['/screenings', 'POST', {}], [`/screenings/${draft.id}`, 'PUT', { ...valid(), expectedRevision: 0 }],
      [`/screenings/${draft.id}/publish`, 'POST', { expectedRevision: 0, confirmConfiguration: true }], [`/screenings/${draft.id}/copy`, 'POST', {}],
      [`/screenings/${draft.id}/questions/from-bank`, 'POST', { expectedRevision: 0, bankQuestionId: new mongoose.Types.ObjectId().toString() }]]) {
      assert.equal((await request(path, accounts[0], method, body, headers)).status, 403);
    }
  }
  assert.equal((await models.Screening.findById(draft.id)).revision, 0);
});
test('publicación rechaza configuraciones incompletas/inconsistentes sin cambiar estado/revisión', async () => {
  const variants = [
    { ...valid(), title: '' }, { ...valid(), area: '' }, { ...valid(), threshold: undefined },
    { ...valid(), questions: [] }, { ...valid(), questions: [valid().questions[1]] },
    { ...valid(), questions: [{ ...valid().questions[0], text: '' }] },
    { ...valid(), questions: [{ ...valid().questions[0], criterion: '' }] },
    { ...valid(), questions: [{ ...valid().questions[0], weight: undefined }] },
    { ...valid(), questions: [{ ...valid().questions[0], options: [{ id: 'yes', label: 'Sí' }, { id: 'no', label: 'No', score: 0 }] }] },
    { ...valid(), questions: [{ ...valid().questions[0], exclusion: { acceptedOptionIds: [] } }] },
    { ...valid(), questions: [{ ...valid().questions[0], exclusion: { acceptedOptionIds: ['yes', 'no'] } }] },
    { ...valid(), questions: [{ ...valid().questions[0], exclusion: { acceptedOptionIds: ['nonexistent'] } }] },
    { ...valid(), questions: [{ ...valid().questions[0], options: [{ id: 'yes', label: 'No puedo confirmarlo', score: 100 }, { id: 'no', label: 'No', score: 0 }] }] },
    { ...valid(), questions: [{ ...valid().questions[0], options: [{ id: 'yes', label: 'Sí', score: 100 }] }] },
    { ...valid(), questions: [...valid().questions, { ...valid().questions[1], id: 'extra', scored: true, weight: 1 }] },
    { ...valid(), questions: [...valid().questions, { ...valid().questions[1], id: 'extra', exclusion: { acceptedOptionIds: [] } }] },
    { ...valid(), questions: [...valid().questions, { ...valid().questions[0], id: 'extra', scored: false }] },
  ];
  for (const config of variants) { const draft = await create(config); assert.equal((await publish(draft.id)).status, 422);
    const stored = await models.Screening.findById(draft.id); assert.equal(stored.status, 'draft'); assert.equal(stored.revision, 0); assert.equal(stored.publishedAt, undefined); }
});

test('opción única, puntuación cero y excluyentes no puntuables admiten configuración válida', async () => {
  const config = valid(); config.threshold = 0; config.questions[0].required = false; config.questions[0].exclusion = undefined;
  config.questions.push({ id: 'knockout', criterion: 'Requisito ficticio', text: '¿Cumplís este requisito del ejemplo?', type: 'single_choice', required: false, scored: false,
    options: Array.from({ length: 8 }, (_, n) => ({ id: `o${n}`, label: `Opción ${n}` })), exclusion: { acceptedOptionIds: ['o0', 'o1'] } });
  config.questions.push({ id: 'info', criterion: 'Información', text: '¿Usaste esta herramienta?', type: 'boolean', required: false, scored: false,
    options: [{ id: 'a', label: 'Sí' }, { id: 'b', label: 'No' }] });
  const draft = await create(config); await result(await publish(draft.id), 200);
  const stored = await result(await request(`/screenings/${draft.id}`), 200); assert.equal(stored.threshold, 0); assert.equal(stored.questions[0].options[1].score, 0);
  assert.equal(stored.questions[2].scored, false); assert.equal(stored.questions[2].required, false);
});

test('publicar requiere confirmación y retorna exactamente el recibo OpenAPI', async () => {
  const draft = await create(valid());
  assert.equal((await request(`/screenings/${draft.id}/publish`, accounts[0], 'POST', { expectedRevision: 0 })).status, 422);
  const receipt = await result(await publish(draft.id), 200);
  assert.deepEqual(Object.keys(receipt).sort(), ['id', 'publishedAt', 'revision', 'status']); assert.equal(receipt.status, 'published'); assert.equal(receipt.revision, 1); assert.ok(Number.isFinite(Date.parse(receipt.publishedAt)));
  const before = await result(await request(`/screenings/${draft.id}`), 200);
  assert.equal((await save(draft.id, { ...valid(), title: 'No debe guardarse' }, 1)).status, 409);
  assert.equal((await publish(draft.id, 1)).status, 409);
  assert.equal((await request(`/screenings/${draft.id}/questions/from-bank`, accounts[0], 'POST', { expectedRevision: 1, bankQuestionId: new mongoose.Types.ObjectId().toString() })).status, 409);
  assert.deepEqual(await result(await request(`/screenings/${draft.id}`), 200), before);
});
test('cerrar un publicado impide nuevas invitaciones y conserva configuración, invitaciones y resultados', async () => {
  const draft = await create(valid());
  assert.equal((await request(`/screenings/${draft.id}/close`, accounts[0], 'POST', { expectedRevision: 0, confirmClosure: true })).status, 409);
  await result(await publish(draft.id), 200);
  const invitation = await models.Invitation.create({ ownerId: accounts[0].user.id, screeningId: draft.id,
    candidateEmail: `closed-${randomUUID()}@example.test`, publicId: randomUUID(), status: 'submitted',
    expiresAt: new Date(Date.now() - 1000), purgeAt: new Date(Date.now() + 90 * 86400000),
    submittedAt: new Date(), report: evaluate(valid().questions, [{ questionId: 'experience', kind: 'option', optionId: 'yes' }], 70) });
  const path = `/screenings/${draft.id}/close`;
  assert.equal((await request(path, accounts[1], 'POST', { expectedRevision: 1, confirmClosure: true })).status, 404);
  assert.equal((await request(path, accounts[0], 'POST', { expectedRevision: 1 })).status, 422);
  assert.equal((await request(path, accounts[0], 'POST', { expectedRevision: 1, confirmClosure: true }, { Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await request(path, accounts[0], 'POST', { expectedRevision: 0, confirmClosure: true })).status, 409);
  const close = await result(await request(path, accounts[0], 'POST', { expectedRevision: 1, confirmClosure: true }), 200);
  assert.equal(close.status, 'closed'); assert.equal(close.revision, 2); assert.ok(Date.parse(close.closedAt));
  assert.equal((await request(path, accounts[0], 'POST', { expectedRevision: 2, confirmClosure: true })).status, 409);
  assert.equal((await save(draft.id, valid(), 2)).status, 409);
  assert.equal((await request(`/screenings/${draft.id}`, accounts[0], 'DELETE', { expectedRevision: 2 })).status, 409);
  assert.equal((await request(`/screenings/${draft.id}/invitations`, accounts[0], 'POST', { candidateEmail: `new-${randomUUID()}@example.test` })).status, 404);
  const listed = await result(await request(`/screenings/${draft.id}/invitations`), 200);
  assert.ok(listed.invitations.some((item) => item.id === invitation.id));
  const report = await result(await request(`/invitations/${invitation.id}/report`), 200);
  assert.equal(report.report.outcome, 'meets'); assert.equal(report.review, null);
  assert.equal((await request(`/invitations/${invitation.id}/report`, accounts[1])).status, 404);
  const copy = await result(await request(`/screenings/${draft.id}/copy`, accounts[0], 'POST', {}), 201);
  assert.equal(copy.status, 'draft'); assert.equal(await models.Invitation.countDocuments({ screeningId: copy.id }), 0);
});
test('la revisión humana exige motivo para continuar contra el resultado y protege la última revisión', async () => {
  const draft = await create(valid()); await result(await publish(draft.id), 200);
  const invitation = await models.Invitation.create({ ownerId: accounts[0].user.id, screeningId: draft.id,
    candidateEmail: `review-${randomUUID()}@example.test`, publicId: randomUUID(), status: 'submitted',
    expiresAt: new Date(Date.now() - 1000), purgeAt: new Date(Date.now() + 90 * 86400000),
    submittedAt: new Date(), report: evaluate(valid().questions, [{ questionId: 'experience', kind: 'option', optionId: 'no' }], 70) });
  const path = `/invitations/${invitation.id}/review`;
  const input = { expectedRevision: 0, decision: 'continue', reason: 'Revisión manual del caso ficticio' };
  assert.equal((await request(path, accounts[1], 'PUT', input)).status, 404);
  assert.equal((await request(path, accounts[0], 'PUT', { ...input, reason: ' ' })).status, 422);
  assert.equal((await request(path, accounts[0], 'PUT', { ...input, decision: 'invalid' })).status, 422);
  assert.equal((await request(path, accounts[0], 'PUT', input, { 'X-CSRF-Token': '' })).status, 403);
  const competing = await Promise.all([request(path, accounts[0], 'PUT', input), request(path, accounts[0], 'PUT', input)]);
  assert.deepEqual(competing.map((response) => response.status).sort(), [200, 409]);
  const first = await result(await request(`/invitations/${invitation.id}/report`), 200);
  assert.equal(first.review.decision, 'continue'); assert.equal(first.review.revision, 1);
  assert.equal(first.report.outcome, 'not_meets');
  const second = await result(await request(path, accounts[0], 'PUT', { expectedRevision: 1, decision: 'clarify', reason: '' }), 200);
  assert.equal(second.review.revision, 2); assert.equal(second.review.decision, 'clarify');
  const afterReview = await result(await request(`/invitations/${invitation.id}/report`), 200);
  assert.equal(afterReview.report.outcome, 'not_meets'); assert.equal(afterReview.review.revision, 2);
  const pending = await models.Invitation.create({ ownerId: accounts[0].user.id, screeningId: draft.id,
    candidateEmail: `pending-${randomUUID()}@example.test`, publicId: randomUUID(),
    expiresAt: new Date(Date.now() + 86400000), purgeAt: new Date(Date.now() + 90 * 86400000) });
  assert.equal((await request(`/invitations/${pending.id}/report`)).status, 409);
  assert.equal((await request(`/invitations/${pending.id}/review`, accounts[0], 'PUT', input)).status, 409);
  await models.Invitation.updateOne({ _id: invitation.id }, { $set: { purgeAt: new Date(Date.now() - 1000) } });
  assert.equal((await request(`/invitations/${invitation.id}/report`)).status, 404);
});
test('dos guardados simultáneos: un ganador, 409 y contenido conservado', async () => {
  const draft = await create(); const responses = await Promise.all([save(draft.id, { ...valid(), title: 'Ganador A' }), save(draft.id, { ...valid(), title: 'Ganador B' })]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]); const winner = await responses.find((r) => r.status === 200).json();
  const stored = await models.Screening.findById(draft.id); assert.equal(stored.revision, 1); assert.equal(stored.title, winner.title);
});
test('guardar/publicar y publicar/publicar simultáneos respetan la misma frontera CAS', async () => {
  const draft = await create(valid()); const competing = await Promise.all([save(draft.id, { ...valid(), title: 'Edición concurrente' }), publish(draft.id)]);
  assert.deepEqual(competing.map((r) => r.status).sort(), [200, 409]); const winner = await competing.find((r) => r.status === 200).json();
  const stored = await models.Screening.findById(draft.id); assert.equal(stored.revision, 1); assert.equal(stored.status, winner.status);
  assert.equal(stored.title, winner.status === 'published' ? 'Screening de prueba' : 'Edición concurrente');
  const second = await create(valid()); const publishing = await Promise.all([publish(second.id), publish(second.id)]);
  assert.deepEqual(publishing.map((r) => r.status).sort(), [200, 409]); assert.equal((await models.Screening.findById(second.id)).revision, 1);
});
test('copia de publicado remapea ids/referencias y no copia invitaciones', async () => {
  const draft = await create(valid()); assert.equal((await request(`/screenings/${draft.id}/copy`, accounts[0], 'POST', {})).status, 409); await result(await publish(draft.id), 200);
  const source = await result(await request(`/screenings/${draft.id}`), 200);
  await models.Invitation.create({ ownerId: accounts[0].user.id, screeningId: draft.id, candidateEmail: 'candidate@example.test', publicId: randomUUID(), expiresAt: new Date('2099-01-01'), purgeAt: new Date('2099-02-01') });
  const copied = await result(await request(`/screenings/${draft.id}/copy`, accounts[0], 'POST', {}), 201);
  assert.notEqual(copied.id, source.id); assert.equal(copied.status, 'draft'); assert.equal(copied.revision, 0); assert.equal('publishedAt' in copied, false);
  assert.equal(await models.Invitation.countDocuments({ screeningId: copied.id }), 0);
  for (let n = 0; n < copied.questions.length; n++) { assert.notEqual(copied.questions[n].id, source.questions[n].id); assert.equal(copied.questions[n].text, source.questions[n].text); }
  assert.ok(copied.questions[0].options.every((o) => !source.questions[0].options.some((prior) => prior.id === o.id)));
  assert.deepEqual(copied.questions[0].exclusion.acceptedOptionIds, [copied.questions[0].options[0].id]);
  copied.questions[0].text = 'Texto cambiado en copia'; await result(await save(copied.id, { ...valid(), questions: copied.questions }), 200);
  assert.deepEqual(await result(await request(`/screenings/${draft.id}`), 200), source);
});
test('catálogo pendiente o destino ajeno no se carga; CLI repetido preserva registros', async () => {
  const pending = catalog(); pending.review.status = 'pending'; await assert.rejects(loadCatalog(connection, pending)); assert.equal(await models.BankQuestion.countDocuments(), 0);
  const outsider = await models.BankQuestion.create({ area: 'Otra área', criterion: 'Ajeno', text: 'Pregunta ajena ficticia', type: 'text', options: [], active: false });
  const path = join(temporary, 'catalog.json'); await writeFile(path, JSON.stringify(catalog()));
  async function command(db = database) {
    const child = spawn(process.execPath, ['scripts/catalog.mjs', '--database', db, '--file', path], { env: { ...process.env, MONGODB_URI: apiUri }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', (chunk) => { output += chunk; }); const [code] = await once(child, 'exit'); return { code, output };
  }
  assert.equal((await command('unrelated_database')).code, 1);
  const first = await command(); assert.equal(first.code, 0, first.output); const second = await command(); assert.equal(second.code, 0, second.output);
  assert.equal(await models.BankQuestion.countDocuments(), 16); assert.ok(await models.BankQuestion.findById(outsider._id));
  const list = await result(await request('/question-bank'), 200); assert.equal(list.questions.length, 15);
  for (const area of catalogAreas) assert.equal((await result(await request(`/question-bank?area=${encodeURIComponent(area)}`), 200)).questions.length, 5);
  assert.equal((await fetch(`${origin}/api/question-bank`)).status, 401);
});
test('preflight de colisión de catálogo impide insertar entradas restantes', async () => {
  const different = catalog(); different.questions[0].text = 'Contenido diferente'; different.questions[14]._id = '68000000000000000000000f';
  await assert.rejects(loadCatalog(connection, different)); assert.equal(await models.BankQuestion.findById('68000000000000000000000f'), null);
});
test('copia de banco no aprueba reglas y conserva texto/opciones/orientación independientes', async () => {
  const entry = (await result(await request(`/question-bank?area=${encodeURIComponent('Tecnología')}`), 200)).questions[0];
  const draft = await create(); const copied = await result(await request(`/screenings/${draft.id}/questions/from-bank`, accounts[0], 'POST', { expectedRevision: 0, bankQuestionId: entry.id }), 200);
  const q = copied.questions[0]; assert.equal(q.bankQuestionId, entry.id); assert.equal(q.text, entry.text); assert.equal(q.guidance, entry.guidance); assert.equal(q.scored, false); assert.equal(q.required, false); assert.equal('weight' in q, false); assert.equal('exclusion' in q, false); assert.ok(q.options.every((o) => o.score === undefined));
  assert.ok(q.options.every((o) => !entry.options.some((prior) => prior.id === o.id)));
  q.text = 'Mi copia editada'; await result(await save(draft.id, { questions: copied.questions }, 1), 200);
  assert.equal((await models.BankQuestion.findById(entry.id)).text, entry.text);
  await models.BankQuestion.updateOne({ _id: entry.id }, { $set: { text: 'Original actualizado', active: false } });
  assert.equal((await result(await request(`/screenings/${draft.id}`), 200)).questions[0].text, 'Mi copia editada');
  assert.equal((await request(`/screenings/${draft.id}/questions/from-bank`, accounts[0], 'POST', { expectedRevision: 2, bankQuestionId: entry.id })).status, 404);
  assert.equal((await request(`/screenings/${draft.id}/questions/from-bank`, accounts[0], 'POST', { expectedRevision: 1, bankQuestionId: new mongoose.Types.ObjectId().toString() })).status, 409);
});

test('copias simultáneas del banco y límite veinte preguntas no pierden cambios', async () => {
  const entries = (await result(await request('/question-bank'), 200)).questions;
  const draft = await create({ questions: Array.from({ length: 19 }, (_, n) => ({ id: `q${n}`, type: 'text', required: false, scored: false, options: [] })) });
  const responses = await Promise.all(entries.slice(0, 2).map((entry) => request(`/screenings/${draft.id}/questions/from-bank`, accounts[0], 'POST', { expectedRevision: 0, bankQuestionId: entry.id })));
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const stored = await result(await request(`/screenings/${draft.id}`), 200); assert.equal(stored.questions.length, 20); assert.equal(stored.revision, 1);
  assert.equal((await request(`/screenings/${draft.id}/questions/from-bank`, accounts[0], 'POST', { expectedRevision: 1, bankQuestionId: entries[0].id })).status, 422);
  assert.equal((await models.Screening.findById(draft.id)).questions.length, 20);
});
