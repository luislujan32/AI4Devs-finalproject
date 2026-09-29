import assert from 'node:assert/strict';
import { before, after, describe, test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import mongoose from 'mongoose';
import { domainModels } from '../apps/api/dist/persistence/models.js';
import { evaluate } from '../apps/api/dist/candidate/evaluation.js';

const q = [
  { id: 'english', criterion: 'Inglés', text: '¿Qué nivel declarás?', type: 'single_choice', required: true, scored: true, weight: 5,
    options: [{ id: 'high', label: 'Alto', score: 100 }, { id: 'low', label: 'Bajo', score: 0 }] },
  { id: 'experience', criterion: 'Experiencia', text: '¿Qué experiencia declarás?', type: 'single_choice', required: false, scored: true, weight: 3,
    options: [{ id: 'yes', label: 'Sí', score: 80 }, { id: 'no', label: 'No', score: 0 }] },
  { id: 'license', criterion: 'Licencia', text: '¿Tenés licencia?', type: 'boolean', required: true, scored: true, weight: 1,
    options: [{ id: 'yes', label: 'Sí', score: 100 }, { id: 'no', label: 'No', score: 0 }], exclusion: { acceptedOptionIds: ['yes'] } },
  { id: 'note', criterion: 'Ejemplo', text: 'Describí un ejemplo', type: 'text', required: false, scored: false, options: [] },
];
const answer = (questionId, optionId) => ({ questionId, kind: 'option', optionId });
const known = [answer('english', 'high'), answer('experience', 'yes'), answer('license', 'yes')];
test('P-01 a P-03: puntaje ponderado, precedencia y contribuciones', () => {
  const met = evaluate(q, known, 70);
  assert.equal(met.score, 840 / 9); assert.equal(met.outcome, 'meets'); assert.equal(met.reason, 'criteria_met');
  assert.equal(met.criteria[0].weightedPoints, 500);
  const knockout = evaluate(q, [known[0], known[1], answer('license', 'no')], 70);
  assert.equal(knockout.score, 740 / 9); assert.equal(knockout.outcome, 'not_meets'); assert.equal(knockout.reason, 'knockout');
  const incomplete = evaluate(q, [{ questionId: 'english', kind: 'unknown' }, known[1], known[2]], 70);
  assert.equal(incomplete.score, null); assert.equal(incomplete.outcome, 'needs_review');
  assert.equal(incomplete.criteria[0].evidence.status, 'unknown'); assert.equal(incomplete.criteria[1].weightedPoints, 240);
  const mixed = evaluate(q, [{ questionId: 'english', kind: 'unknown' }, known[1], answer('license', 'no')], 70);
  assert.equal(mixed.score, null); assert.equal(mixed.outcome, 'not_meets'); assert.equal(mixed.reason, 'knockout'); assert.equal(mixed.incomplete, true);
  assert.equal(met.criteria[3].evidence.status, 'missing'); assert.equal(met.incomplete, false);
});
test('P-02/P-08: igualdad del umbral sin redondeo y desconocido excluyente sin cero', () => {
  const equalQuestions = q.slice(0, 2).map((question) => ({ ...question, options: [{ id: 'a', label: '70', score: 70 }, { id: 'b', label: '69', score: 69 }] }));
  const equal = evaluate(equalQuestions, [answer('english', 'a'), answer('experience', 'a')], 70);
  assert.equal(equal.score, 70); assert.equal(equal.outcome, 'meets');
  const below = evaluate(equalQuestions, [answer('english', 'a'), answer('experience', 'b')], 70);
  assert.ok(below.score < 70); assert.equal(below.outcome, 'not_meets');
  const extra = evaluate(q, [known[0], known[1], { questionId: 'license', kind: 'unknown' }], 70);
  assert.equal(extra.score, null); assert.equal(extra.criteria[2].exclusionStatus, 'unknown'); assert.equal(extra.reason, 'incomplete');
  const unscoredExclusion = evaluate([{ ...q[2], scored: false, weight: undefined }], [{ questionId: 'license', kind: 'unknown' }], 70);
  assert.equal(unscoredExclusion.criteria[0].exclusionStatus, 'unknown'); assert.equal(unscoredExclusion.outcome, 'needs_review');
});

describe('API de intento con MongoDB y Mailpit', () => {
const dbName = `screeningroom_demo_test_${randomUUID().replaceAll('-', '')}`;
const mailpit = `http://127.0.0.1:${process.env.MAILPIT_HTTP_PORT ?? 8026}`;
let connection, models, server, origin, screening, invites, sessions;
const cookie = (response, key) => response.headers.getSetCookie().find((value) => value.startsWith(`${key}=`))?.split(';')[0];
const call = (path, account, method = 'GET', body, extra = {}) => fetch(`${origin}/api${path}`, { method,
  headers: { ...(account ? { Cookie: account.cookie, Origin: origin, 'X-CSRF-Token': account.csrfToken } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
async function mailCode(recipient) {
  for (let n = 0; n < 30; n++) {
    const list = await (await fetch(`${mailpit}/api/v1/messages?limit=100`)).json();
    const item = list.messages.find((message) => JSON.stringify(message.To).includes(recipient));
    if (item) { const detail = await (await fetch(`${mailpit}/api/v1/message/${item.ID}`)).json();
      const code = detail.Text?.match(/\b\d{6}\b/)?.[0]; if (code) return code; }
    await delay(100);
  }
  throw new Error('Mailpit no recibió el código de prueba.');
}
async function candidateLogin(invitation) {
  const csrfResponse = await call('/auth/csrf');
  const csrf = { csrfToken: (await csrfResponse.json()).csrfToken, cookie: cookie(csrfResponse, 'sr_csrf') };
  const request = await call('/candidate/access/request', csrf, 'POST', { publicId: invitation.publicId });
  assert.equal(request.status, 200);
  const code = await mailCode(invitation.candidateEmail);
  const verified = await call('/candidate/access/verify', csrf, 'POST', { publicId: invitation.publicId, code });
  assert.equal(verified.status, 200);
  return { csrfToken: (await verified.json()).csrfToken, cookie: cookie(verified, 'sr_session') };
}
before(async () => {
  let mailboxReady = false;
  for (let n = 0; n < 30; n++) {
    try { if ((await fetch(`${mailpit}/api/v1/messages?limit=1`)).ok) { mailboxReady = true; break; } } catch { /* bounded startup */ }
    await delay(100);
  }
  assert.ok(mailboxReady, 'Mailpit local debe estar disponible.');
  const parsed = new URL(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom'); parsed.pathname = `/${dbName}`;
  connection = await mongoose.createConnection(parsed.toString(), { serverSelectionTimeoutMS: 3000 }).asPromise();
  models = domainModels(connection); await Promise.all(Object.values(models).map((model) => model.init()));
  const ownerId = new mongoose.Types.ObjectId();
  screening = await models.Screening.create({ ownerId, title: 'Evaluación ficticia', area: 'Tecnología', status: 'published',
    revision: 1, publishedAt: new Date(), threshold: 70, questions: q });
  invites = [];
  for (let n = 0; n < 2; n++) invites.push(await models.Invitation.create({ ownerId, screeningId: screening._id,
    candidateEmail: `attempt-${n}-${randomUUID()}@example.test`, publicId: randomBytes(32).toString('base64url'),
    expiresAt: new Date(Date.now() + 7 * 86400000), purgeAt: new Date(Date.now() + 90 * 86400000) }));
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise((resolve) => probe.close(resolve)); origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['apps/api/dist/main.js'], { env: { ...process.env, MONGODB_URI: parsed.toString(),
    API_PORT: String(port), PUBLIC_ORIGIN: origin, SESSION_SECRET: randomBytes(32).toString('base64url'), NODE_ENV: 'test' }, stdio: 'ignore' });
  let ready = false;
  for (let n = 0; n < 50; n++) { if (server.exitCode !== null) throw new Error('API de prueba no inició.');
    try { if ((await call('/health/ready')).ok) { ready = true; break; } } catch { /* bounded startup */ } await delay(100); }
  assert.ok(ready);
  sessions = await Promise.all(invites.map(candidateLogin));
});
after(async () => {
  if (server && server.exitCode === null) { const ended = once(server, 'exit'); server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 4000); await ended; clearTimeout(timer); }
  if (connection) { assert.equal(connection.name, dbName); try { await connection.dropDatabase(); } finally { await connection.close(); } }
});

test('la proyección propia no revela reglas ni respuestas ajenas', async () => {
  assert.equal((await call('/candidate/attempt')).status, 401);
  const first = await call('/candidate/attempt', sessions[0]); assert.equal(first.status, 200);
  const data = await first.json();
  assert.equal(data.title, 'Evaluación ficticia'); assert.equal(data.questions.length, 4);
  for (const forbidden of ['threshold', 'score', 'weight', 'scored', 'criterion', 'exclusion', 'acceptedOptionIds', 'ownerId', 'report']) {
    assert.equal(JSON.stringify(data).includes(`"${forbidden}"`), false);
  }
  assert.deepEqual(data.answers, []); assert.equal(data.answerRevision, 0);
  const second = await (await call('/candidate/attempt', sessions[1])).json();
  assert.deepEqual(second.answers, []);
});

test('borrador valida formas, permite faltantes y rechaza revisión antigua sin sobrescribir', async () => {
  const invalid = [[{ questionId: 'foreign', kind: 'unknown' }], [{ questionId: 'note', kind: 'unknown' }],
    [{ questionId: 'english', kind: 'option', optionId: 'foreign' }], [{ questionId: 'note', kind: 'text', text: '  ' }],
    [{ questionId: 'english', kind: 'unknown', optionId: 'high' }], [{ questionId: 'english', kind: 'unknown' }, { questionId: 'english', kind: 'unknown' }]];
  for (const answers of invalid) assert.equal((await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 0, answers })).status, 422);
  assert.equal((await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 0, answers: [], invitationId: invites[1].id })).status, 422);
  const saved = await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 0,
    answers: [{ questionId: 'english', kind: 'unknown' }, { questionId: 'note', kind: 'text', text: 'Caso propio' }] });
  assert.equal(saved.status, 200); assert.equal((await saved.json()).answerRevision, 1);
  assert.equal((await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 0, answers: [] })).status, 409);
  const reread = await (await call('/candidate/attempt', sessions[0])).json();
  assert.equal(reread.answers.length, 2); assert.equal(reread.answerRevision, 1);
  assert.deepEqual((await (await call('/candidate/attempt', sessions[1])).json()).answers, []);
  assert.equal((await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 1, answers: [] },
    { Origin: 'https://foreign.example' })).status, 403);
  await models.Invitation.updateOne({ _id: invites[0]._id }, { $set: { 'auth.lastRequestedAt': new Date(Date.now() - 61000) } });
  sessions[0] = await candidateLogin(invites[0]);
  const resumed = await (await call('/candidate/attempt', sessions[0])).json();
  assert.equal(resumed.answerRevision, 1); assert.deepEqual(resumed.answers, reread.answers);
});

test('obligatorias, informe interno y recibo idempotente ante doble envío', async () => {
  assert.equal((await call('/candidate/attempt/submit', sessions[0], 'POST', { expectedRevision: 1 })).status, 422);
  const answers = [{ questionId: 'english', kind: 'unknown' }, answer('experience', 'yes'), answer('license', 'no'),
    { questionId: 'note', kind: 'text', text: 'Ejemplo declarado' }];
  const saved = await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 1, answers });
  assert.equal(saved.status, 200); assert.equal((await saved.json()).answerRevision, 2);
  const responses = await Promise.all([call('/candidate/attempt/submit', sessions[0], 'POST', { expectedRevision: 2 }),
    call('/candidate/attempt/submit', sessions[0], 'POST', { expectedRevision: 2 })]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  const receipts = await Promise.all(responses.map((response) => response.json()));
  assert.deepEqual(receipts[0], receipts[1]); assert.deepEqual(Object.keys(receipts[0]).sort(), ['status', 'submittedAt']);
  assert.equal((await call('/candidate/attempt/answers', sessions[0], 'PUT', { expectedRevision: 2, answers: [] })).status, 409);
  const stored = await models.Invitation.findById(invites[0].id);
  assert.equal(stored.report.outcome, 'not_meets'); assert.equal(stored.report.reason, 'knockout');
  assert.equal(stored.report.score, null); assert.equal(stored.report.incomplete, true);
  assert.equal(stored.report.criteria[0].evidence.status, 'unknown');
  assert.equal(stored.report.criteria[2].exclusionStatus, 'not_met');
  assert.equal((await (await call('/candidate/attempt', sessions[0])).json()).status, 'submitted');
  assert.deepEqual(await (await call('/candidate/attempt/submit', sessions[0], 'POST', { expectedRevision: 0 })).json(), receipts[0]);
});

test('dos guardados concurrentes admiten un ganador; invitación vencida corta lectura y escritura', async () => {
  const bodies = [answer('english', 'high'), answer('license', 'yes')];
  const responses = await Promise.all([call('/candidate/attempt/answers', sessions[1], 'PUT', { expectedRevision: 0, answers: bodies }),
    call('/candidate/attempt/answers', sessions[1], 'PUT', { expectedRevision: 0, answers: [] })]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  const saved = await (await call('/candidate/attempt', sessions[1])).json();
  assert.equal(saved.answerRevision, 1);
  await models.Invitation.updateOne({ _id: invites[1]._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await call('/candidate/attempt', sessions[1])).status, 401);
  assert.equal((await call('/candidate/attempt/answers', sessions[1], 'PUT', { expectedRevision: 1, answers: [] })).status, 401);
  assert.equal((await call('/candidate/attempt/submit', sessions[1], 'POST', { expectedRevision: 1 })).status, 401);
});
});
