import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { domainModels } from '../apps/api/dist/persistence/models.js';
import { PersistenceRepository } from '../apps/api/dist/persistence/persistence.repository.js';
import { loadFixtures, fixtureIds } from '../apps/api/dist/persistence/fixtures.js';

const database = `screeningroom_fixtures_test_${randomUUID().replaceAll('-', '')}`;
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom';
let connection, models, repository;
const id = () => new mongoose.Types.ObjectId();
const future = new Date('2099-01-01T00:00:00Z');
const question = (patch = {}) => ({ id: 'q1', criterion: 'Criterio ficticio', text: 'Pregunta ficticia', type: 'boolean',
  required: true, scored: true, weight: 1, options: [{ id: 'yes', label: 'Sí', score: 100 }, { id: 'no', label: 'No', score: 0 }], ...patch });
const invitation = (patch = {}) => ({ ownerId: id(), screeningId: id(), candidateEmail: `${randomUUID()}@example.test`,
  publicId: randomUUID(), expiresAt: future, purgeAt: future, ...patch });
const invalid = (operation) => assert.rejects(operation, (error) => error.name === 'ValidationError' || error.name === 'StrictModeError');
const duplicate = (operation) => assert.rejects(operation, (error) => error.code === 11000);

before(async () => {
  connection = await mongoose.createConnection(uri, { dbName: database, serverSelectionTimeoutMS: 3000 }).asPromise();
  models = domainModels(connection);
  await Promise.all(Object.values(models).map((model) => model.init()));
  repository = new PersistenceRepository(connection);
});
after(async () => {
  if (!connection) return;
  assert.equal(connection.name, database);
  assert.match(database, /^screeningroom_fixtures_test_[a-f0-9]+$/);
  try { await connection.dropDatabase(); } finally { await connection.close(); }
});

test('la carga por comando es repetible y preserva documentos ajenos', async () => {
  const outsider = await models.User.create({ email: 'outsider@example.test', passwordHash: '!inactive', displayName: 'Ajeno', active: false });
  const before = await connection.collection('users').findOne({ _id: outsider._id });
  const run = () => promisify(execFile)(process.execPath, ['scripts/fixtures.mjs', '--database', database], {
    env: { ...process.env, MONGODB_URI: uri }, timeout: 15000,
  });
  await run();
  const counts = await Promise.all(Object.values(models).map((model) => model.countDocuments()));
  await run();
  assert.deepEqual(await Promise.all(Object.values(models).map((model) => model.countDocuments())), counts);
  assert.deepEqual(await connection.collection('users').findOne({ _id: outsider._id }), before);
  assert.equal((await models.User.findById(fixtureIds.user)).active, false);
  assert.equal(await models.Session.countDocuments(), 0);
});

test('fixtures rechazan destinos ajenos y colisiones sin sobreescribir', async () => {
  await assert.rejects(loadFixtures({ name: 'screeningroom' }), /requieren una BD/);
  const colliding = await models.User.findById(fixtureIds.user);
  await models.User.updateOne({ _id: colliding._id }, { $set: { email: 'collision@example.test' } });
  await assert.rejects(loadFixtures(connection), /Colisión/);
  assert.equal((await models.User.findById(colliding._id)).email, 'collision@example.test');
  await models.User.updateOne({ _id: colliding._id }, { $set: { email: 't01-recruiter@example.test' } });
});

test('borradores incompletos persisten sin configuración de publicación', async () => {
  const draft = await models.Screening.create({ ownerId: id(), questions: [{ id: 'q', type: 'single_choice', scored: true }] });
  const saved = await models.Screening.findById(draft._id);
  assert.equal(saved.status, 'draft');
  assert.equal(saved.threshold, undefined);
  assert.equal(saved.questions[0].weight, undefined);
});

test('límites e identificadores se validan antes de conservar un documento', async () => {
  const cases = [
    { revision: -1 }, { revision: 1.5 }, { threshold: 101 }, { title: 'x'.repeat(121) },
    { description: 'x'.repeat(6001) }, { questions: Array.from({ length: 21 }, (_, n) => question({ id: String(n) })) },
    { questions: [question(), question()] }, { questions: [question({ weight: 0 })] },
    { questions: [question({ criterion: 'x'.repeat(121) })] }, { questions: [question({ text: 'x'.repeat(501) })] },
    { questions: [question({ options: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] })] },
    { questions: [question({ options: [{ id: 'a', label: 'A', score: 100.5 }] })] },
    { questions: [question({ options: [{ id: 'a', label: 'A', score: -1 }] })] },
    { questions: [question({ options: Array.from({ length: 9 }, (_, n) => ({ id: String(n), label: String(n) })) })] },
    { questions: [question({ exclusion: { acceptedOptionIds: ['yes', 'yes'] } })] },
  ];
  for (const data of cases) {
    const key = id();
    await invalid(() => models.Screening.create({ _id: key, ownerId: id(), ...data }));
    assert.equal(await models.Screening.exists({ _id: key }), null);
  }
});

test('respuestas discriminadas y una respuesta por pregunta', async () => {
  for (const answers of [
    [{ questionId: 'q', kind: 'unknown', optionId: 'yes' }],
    [{ questionId: 'q', kind: 'option' }],
    [{ questionId: 'q', kind: 'option', optionId: 'yes', text: 'extra' }],
    [{ questionId: 'q', kind: 'text', text: 'x'.repeat(2001) }],
    [{ questionId: 'q', kind: 'text', text: '' }],
    [{ questionId: 'q', kind: 'unknown' }, { questionId: 'q', kind: 'unknown' }],
  ]) await invalid(() => models.Invitation.create(invitation({ answers })));
  const saved = await models.Invitation.create(invitation({ answers: [{ questionId: 'q', kind: 'unknown' }] }));
  assert.deepEqual(saved.answers[0].toObject(), { questionId: 'q', kind: 'unknown' });
});

test('unicidad real de email normalizado incluso con escrituras simultáneas', async () => {
  const shared = `${randomUUID()}@example.test`;
  const writes = await Promise.allSettled([
    models.User.create({ email: ` ${shared.toUpperCase()} `, passwordHash: '!inactive', displayName: 'A' }),
    models.User.create({ email: shared, passwordHash: '!inactive', displayName: 'B' }),
  ]);
  assert.equal(writes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(writes.find((result) => result.status === 'rejected').reason.code, 11000);
  assert.equal(await models.User.countDocuments({ email: shared }), 1);
  assert.equal((await models.User.findOne({ email: shared })).passwordHash, undefined);
});

test('invitación única por screening/correo y publicId único', async () => {
  const first = invitation();
  await models.Invitation.create(first);
  await duplicate(() => models.Invitation.create({ ...first, publicId: randomUUID(), candidateEmail: ` ${first.candidateEmail.toUpperCase()} ` }));
  await duplicate(() => models.Invitation.create(invitation({ publicId: first.publicId })));
  await models.Invitation.create({ ...first, screeningId: id(), publicId: randomUUID() });
});

test('referencias inexistentes, ajenas y sin publicar son rechazadas sin crear invitación', async () => {
  const ownerId = id();
  const draft = await models.Screening.create({ ownerId });
  const published = await models.Screening.create({ ownerId, status: 'published', threshold: 70, questions: [question()] });
  const input = { candidateEmail: `${randomUUID()}@example.test`, expiresAt: future, purgeAt: future };
  const count = await models.Invitation.countDocuments();
  assert.equal(await repository.createInvitation(ownerId, id(), input), null);
  assert.equal(await repository.createInvitation(ownerId, draft._id, input), null);
  assert.equal(await repository.createInvitation(id(), published._id, input), null);
  assert.equal(await repository.findOwnedScreening(id(), published._id), null);
  assert.equal(await models.Invitation.countDocuments(), count);
  const saved = await repository.createInvitation(ownerId, published._id, input);
  assert.ok(saved);
  assert.match(saved.publicId, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(saved.ownerId.toString(), ownerId.toString());
});

test('CAS admite un solo guardado y conserva revisión/contenido del ganador', async () => {
  const ownerId = id();
  const draft = await models.Screening.create({ ownerId });
  const writes = await Promise.all([
    repository.saveDraftQuestions(ownerId, draft._id, 0, [question({ text: 'A' })]),
    repository.saveDraftQuestions(ownerId, draft._id, 0, [question({ text: 'B' })]),
  ]);
  const winner = writes.find(Boolean);
  assert.equal(writes.filter(Boolean).length, 1);
  const saved = await models.Screening.findById(draft._id);
  assert.equal(saved.revision, 1);
  assert.equal(saved.questions[0].text, winner.questions[0].text);
  assert.equal(await repository.saveDraftQuestions(id(), draft._id, 1, []), null);
  await invalid(() => repository.saveDraftQuestions(ownerId, draft._id, 1, [question(), question()]));
  assert.equal((await models.Screening.findById(draft._id)).revision, 1);
  await models.Screening.updateOne({ _id: draft._id }, { $set: { status: 'published' } });
  assert.equal(await repository.saveDraftQuestions(ownerId, draft._id, 1, []), null);
});

test('contenido copiado del banco no cambia al editar el original', async () => {
  const bank = await models.BankQuestion.create({ area: 'Prueba', criterion: 'C', text: 'Original', type: 'text', guidance: 'G' });
  const screen = await models.Screening.create({ ownerId: id(), questions: [question({ type: 'text', scored: false, weight: undefined,
    bankQuestionId: bank._id, options: [], text: bank.text, guidance: bank.guidance })] });
  await models.BankQuestion.updateOne({ _id: bank._id }, { $set: { text: 'Modificado' } });
  const saved = await models.Screening.findById(screen._id);
  assert.equal(saved.questions[0].text, 'Original');
  assert.equal(saved.questions[0].guidance, 'G');
});

test('informe con score nulo y revisión independiente se conservan', async () => {
  const report = { algorithmVersion: 'v1', outcome: 'needs_review', reason: 'incomplete', score: null, threshold: 70,
    incomplete: true, generatedAt: new Date(), criteria: [{ questionId: 'q1', criterion: 'C', question: 'P',
      evidence: { status: 'unknown', source: 'candidate_declaration', answerText: null }, exclusionStatus: 'unknown' }] };
  const saved = await models.Invitation.create(invitation({ report,
    review: { decision: 'continue', reason: 'Revisar información', reviewerId: id(), reviewedAt: new Date(), revision: 1 } }));
  const before = (await models.Invitation.findById(saved._id)).report.toObject();
  await models.Invitation.updateOne({ _id: saved._id }, { $set: { 'review.reason': 'Aclaración posterior' } }, { runValidators: true });
  const after = await models.Invitation.findById(saved._id);
  assert.equal(after.report.score, null);
  assert.equal(after.report.criteria[0].optionScore, null);
  assert.equal(after.report.criteria[0].weight, null);
  assert.equal(after.report.criteria[0].evidence.source, 'candidate_declaration');
  assert.deepEqual(after.report.toObject(), before);
  assert.equal(after.review.reason, 'Aclaración posterior');
});

test('informe respeta Evidence de OpenAPI y no presenta declaraciones como verificaciones', async () => {
  const report = { algorithmVersion: 'v1', outcome: 'needs_review', reason: 'incomplete', threshold: 70,
    incomplete: true, generatedAt: new Date(), criteria: [] };
  await invalid(() => models.Invitation.create(invitation({ report })));
  const criterion = { questionId: 'q', criterion: 'C', question: 'P', exclusionStatus: 'unknown' };
  await invalid(() => models.Invitation.create(invitation({ report: { ...report, criteria: [criterion] } })));
  await invalid(() => models.Invitation.create(invitation({ report: { ...report, criteria: [{ ...criterion,
    evidence: { status: 'known', source: 'verified_certificate', answerText: 'Sí' } }] } })));
});

test('sesiones contienen un solo principal y no admiten contraseñas ni respuestas', async () => {
  const base = { sessionId: randomUUID(), csrfToken: randomUUID(), expiresAt: future };
  await invalid(() => models.Session.create({ ...base, principal: 'candidate', userId: id(), invitationId: id() }));
  await invalid(() => models.Session.create({ ...base, principal: 'recruiter' }));
  await invalid(() => models.Session.create({ ...base, principal: 'recruiter', userId: id(), passwordHash: 'forbidden' }));
  await models.Session.create({ ...base, principal: 'candidate', invitationId: id() });
  const saved = await models.Session.findOne({ sessionId: base.sessionId });
  assert.equal(saved.userId, undefined);
  assert.equal(saved.csrfToken, undefined);
  assert.equal(saved.sessionId, undefined);
});

test('índices TTL y de consulta están presentes sin confundirlos con autorización', async () => {
  for (const [model, field] of [[models.Invitation, 'purgeAt'], [models.Session, 'expiresAt']]) {
    const indexes = await model.collection.indexes();
    assert.ok(indexes.some((index) => index.key[field] === 1 && index.expireAfterSeconds === 0));
  }
  for (const model of [models.Screening, models.Invitation]) {
    assert.ok((await model.collection.indexes()).some((index) => index.key.ownerId === 1 && index.key.createdAt === -1));
  }
  assert.ok((await models.BankQuestion.collection.indexes()).some((index) => index.key.area === 1 && index.key.active === 1));
});
