import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { sendCode, sendInvitation, MailDeliveryError } from '../apps/api/dist/candidate/mail.js';
import { fictitiousEmail, realEmail, validateMailConfiguration } from '../apps/api/dist/candidate/mail-config.js';
import { CandidateService } from '../apps/api/dist/candidate/candidate.service.js';
import { AuthService } from '../apps/api/dist/auth/auth.service.js';
import { PersistenceRepository } from '../apps/api/dist/persistence/persistence.repository.js';
import { domainModels } from '../apps/api/dist/persistence/models.js';

// The provider is always mocked: these fixtures must never send external mail.
const keys = ['MAIL_PROVIDER', 'BREVO_API_KEY', 'MAIL_FROM_EMAIL', 'SCREENINGROOM_PUBLIC_DEMO', 'DEMO_MAIL_PASSWORD', 'SESSION_SECRET', 'PUBLIC_ORIGIN'];
let saved;
beforeEach(() => {
  saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, { MAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'fixture-key-with-no-real-access', MAIL_FROM_EMAIL: 'sender@example.org',
    SCREENINGROOM_PUBLIC_DEMO: '0', SESSION_SECRET: randomBytes(32).toString('base64url'), PUBLIC_ORIGIN: 'https://demo.example.org' });
});
afterEach(() => { for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; } });
const accepted = () => new Response(JSON.stringify({ messageId: '<fixture@example.org>' }), { status: 201 });

test('configuración explícita; no admite proveedor desconocido ni remitente inválido', () => {
  validateMailConfiguration();
  delete process.env.BREVO_API_KEY;
  assert.throws(validateMailConfiguration, /Configuración de correo/);
  process.env.MAIL_PROVIDER = 'unknown';
  assert.throws(validateMailConfiguration, /Proveedor de correo/);
  process.env.MAIL_PROVIDER = 'mailpit';
  assert.doesNotThrow(validateMailConfiguration);
  assert.equal(fictitiousEmail('alex@sub.example.test'), true);
  for (const email of ['a\r\nb@example.org', 'a@b', 'a@-example.org', 'a@example.invalid', '.a@example.org', 'a..b@example.org']) assert.equal(realEmail(email), false);
});

test('Brevo recibe una invitación HTML escapada, solo un destinatario y ningún informe', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(options.headers['api-key'], process.env.BREVO_API_KEY);
    assert.equal(options.redirect, 'error');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, [{ email: 'reviewer@example.org', contactPixelTrackingConsent: false }]);
    assert.deepEqual(body.sender, { email: 'sender@example.org', name: 'Screeningroom' });
    assert.match(body.htmlContent, /&lt;Puesto&gt;/);
    assert.match(body.htmlContent, /&lt;Alex&gt;/);
    assert.match(body.htmlContent, /https:\/\/demo.example.org/);
    assert.equal(body.textContent, undefined);
    assert.equal(body.contacts, undefined);
    assert.equal(body.report, undefined);
    return accepted();
  });
  await sendInvitation('reviewer@example.org', '<Alex>', '<Puesto>', 'https://demo.example.org/#invite=fixture', new Date());
  assert.equal(mock.mock.callCount(), 1);
});

test('el código usa texto y un fallo remoto nunca filtra clave ni respuesta del proveedor', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.match(body.textContent, /123456/);
    assert.equal(body.htmlContent, undefined);
    return new Response('sensitive-provider-response', { status: 401 });
  });
  await assert.rejects(sendCode('reviewer@example.org', '123456'), (error) => error instanceof MailDeliveryError && !error.uncertain
    && !error.message.includes(process.env.BREVO_API_KEY) && !error.message.includes('sensitive-provider-response'));
  assert.equal(mock.mock.callCount(), 1);
});

test('timeout, respuesta 5xx y recibo ilegible son inciertos; no hay reintento automático', async (t) => {
  for (const result of [() => { throw new Error('network-secret'); }, () => new Response('', { status: 503 }), () => new Response('invalid', { status: 201 })]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => result());
    await assert.rejects(sendCode('reviewer@example.org', '123456'), (error) => error instanceof MailDeliveryError && error.uncertain);
    assert.equal(mock.mock.callCount(), 1);
    mock.mock.restore();
  }
});

test('example.test permanece en Mailpit autenticado con Brevo activo', async (t) => {
  process.env.SCREENINGROOM_PUBLIC_DEMO = '1'; process.env.DEMO_MAIL_PASSWORD = 'fixture-mailbox-password';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.match(url, /^http:\/\/127\.0\.0\.1:\d+\/buzon\/api\/v1\/send$/);
    assert.ok(options.headers.Authorization.startsWith('Basic '));
    assert.equal(JSON.parse(options.body).To[0].Email, 'alex@example.test');
    return new Response('{}', { status: 200 });
  });
  await sendCode('alex@example.test', '123456');
});

test('desactivar Brevo no copia mensajes de destinatarios reales al buzón compartido', async (t) => {
  process.env.MAIL_PROVIDER = 'mailpit';
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No debe llamar al transporte.'); });
  await assert.rejects(sendCode('reviewer@example.org', '123456'), MailDeliveryError);
  assert.equal(mock.mock.callCount(), 0);
});

test('invitación incierta persiste; rechazo permite reintentar; cuota se comparte con códigos y reinicios', async (t) => {
  const database = `screeningroom_demo_mail_${randomUUID().replaceAll('-', '')}`;
  const connection = await mongoose.createConnection(`mongodb://127.0.0.1:27018/${database}`, { serverSelectionTimeoutMS: 3000 }).asPromise();
  try {
    const models = domainModels(connection);
    const repository = new PersistenceRepository(connection); await repository.onModuleInit();
    const auth = new AuthService(connection); await auth.onModuleInit();
    auth.checkLoginCsrf = () => {}; // CSRF/ownership already have HTTP integration suites.
    const service = new CandidateService(connection, auth, repository);
    const ownerId = new mongoose.Types.ObjectId().toString();
    const screening = await models.Screening.create({ ownerId, title: 'Correo ficticio de prueba', area: 'Tecnología', status: 'published',
      threshold: 70, publishedAt: new Date(), questions: [{ id: 'q', criterion: 'Criterio', text: '¿Usaste Git?', type: 'boolean', required: true,
        scored: true, weight: 1, options: [{ id: 'yes', label: 'Sí', score: 100 }, { id: 'no', label: 'No', score: 0 }] }] });
    let response = () => { throw new Error('timeout'); };
    const mock = t.mock.method(globalThis, 'fetch', async () => response());
    const invite = (email) => service.create(ownerId, screening.id, { candidateEmail: email }, 'https://demo.example.org');
    const uncertain = await invite('uncertain@example.org');
    assert.equal(uncertain.emailSent, false); assert.equal(uncertain.emailDeliveryStatus, 'unconfirmed');
    const row = await models.Invitation.findById(uncertain.id).select('+emailAccess.tokenHash');
    assert.ok(row.emailAccess.tokenHash);
    assert.equal((await service.list(ownerId, screening.id)).invitations[0].emailDeliveryStatus, 'unconfirmed');
    response = () => new Response('', { status: 400 });
    await assert.rejects(invite('rejected@example.org'), (error) => error.getStatus() === 503);
    assert.equal(await models.Invitation.countDocuments({ candidateEmail: 'rejected@example.org' }), 0);
    response = accepted;
    const sent = await invite('rejected@example.org');
    assert.equal(sent.emailSent, true);
    assert.equal((await models.Invitation.findById(sent.id)).emailDeliveryStatus, 'accepted');
    const requested = await service.requestCode({ socket: { remoteAddress: '127.0.0.1' } }, { publicId: sent.publicId });
    assert.equal(requested.mailDelivery, 'email'); assert.equal(requested.status, 'sent');
    assert.ok((await models.Invitation.findById(sent.id)).auth.challengeId);
    await connection.db.collection('auth_limits').deleteMany({});
    for (let n = 0; n < 50; n++) await auth.consumeLimit('external-mail-day', 'shared-demo', 50, 86400000);
    const calls = mock.mock.callCount();
    await assert.rejects(invite('limited@example.org'), (error) => error.getStatus() === 429);
    assert.equal(await models.Invitation.countDocuments({ candidateEmail: 'limited@example.org' }), 0);
    await assert.rejects(service.requestCode({ socket: { remoteAddress: '127.0.0.1' } }, { publicId: uncertain.publicId }), (error) => error.getStatus() === 429);
    assert.equal(mock.mock.callCount(), calls);
    const restarted = new AuthService(connection);
    await assert.rejects(restarted.consumeLimit('external-mail-day', 'shared-demo', 50, 86400000), (error) => error.getStatus() === 429);
  } finally {
    assert.equal(connection.name, database);
    try { await connection.dropDatabase(); } finally { await connection.close(); }
  }
});
