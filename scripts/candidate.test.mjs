import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import mongoose from 'mongoose';
import { domainModels } from '../apps/api/dist/persistence/models.js';
import { provisionDemo, demoEmails } from '../apps/api/dist/auth/provision.js';

const dbName = `screeningroom_demo_test_${randomUUID().replaceAll('-', '')}`;
const passwords = [randomBytes(24).toString('base64url'), randomBytes(24).toString('base64url')];
const mailpit = `http://127.0.0.1:${process.env.MAILPIT_HTTP_PORT ?? 8026}`;
let connection, models, server, origin, accounts, published, draft;
const cookie = (response, key) => response.headers.getSetCookie().find((value) => value.startsWith(`${key}=`))?.split(';')[0];
const call = (path, method = 'GET', body, account) => fetch(`${origin}/api${path}`, { method,
  headers: { ...(account ? { Cookie: account.cookie, Origin: origin, 'X-CSRF-Token': account.csrfToken } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
async function prelogin() {
  const response = await call('/auth/csrf');
  assert.equal(response.status, 200);
  return { csrfToken: (await response.json()).csrfToken, cookie: cookie(response, 'sr_csrf') };
}
async function recruiterLogin(index) {
  const csrf = await prelogin();
  const response = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json',
    Origin: origin, Cookie: csrf.cookie, 'X-CSRF-Token': csrf.csrfToken },
  body: JSON.stringify({ email: demoEmails[index], password: passwords[index] }) });
  assert.equal(response.status, 200);
  return { ...await response.json(), cookie: cookie(response, 'sr_session') };
}
async function candidatePost(path, body, csrf, sessionCookie = '') {
  return fetch(`${origin}/api/candidate${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json',
    Origin: origin, Cookie: [csrf.cookie, sessionCookie].filter(Boolean).join('; '), 'X-CSRF-Token': csrf.csrfToken }, body: JSON.stringify(body) });
}
async function mailCode(recipient) {
  for (let n = 0; n < 30; n++) {
    const response = await fetch(`${mailpit}/api/v1/messages?limit=100`);
    assert.equal(response.status, 200);
    const list = await response.json();
    const item = list.messages.find((message) => JSON.stringify(message.To).includes(recipient));
    if (item) {
      const detail = await (await fetch(`${mailpit}/api/v1/message/${item.ID}`)).json();
      const code = detail.Text?.match(/\b\d{6}\b/)?.[0];
      if (code) return code;
    }
    await delay(100);
  }
  throw new Error('Mailpit no recibió el código de prueba.');
}
async function invite(email, account = accounts[0], id = published._id.toString()) {
  return call(`/screenings/${id}/invitations`, 'POST', { candidateEmail: email, candidateName: 'Alex Ficticio' }, account);
}

before(async () => {
  const parsed = new URL(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom');
  parsed.pathname = `/${dbName}`;
  connection = await mongoose.createConnection(parsed.toString(), { serverSelectionTimeoutMS: 3000 }).asPromise();
  models = domainModels(connection);
  await provisionDemo(connection, passwords);
  const ownerId = (await models.User.findOne({ email: demoEmails[0] }))._id;
  published = await models.Screening.create({ ownerId, title: 'Publicado ficticio', area: 'Tecnología', status: 'published', revision: 1,
    publishedAt: new Date(), threshold: 70, questions: [{ id: 'q1', criterion: 'Experiencia', text: '¿Usaste Git?', type: 'boolean', required: true,
      scored: true, weight: 1, options: [{ id: 'yes', label: 'Sí', score: 100 }, { id: 'no', label: 'No', score: 0 }] }] });
  draft = await models.Screening.create({ ownerId, title: 'Borrador ficticio', status: 'draft' });
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise((resolve) => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['apps/api/dist/main.js'], { env: { ...process.env, MONGODB_URI: parsed.toString(),
    API_PORT: String(port), PUBLIC_ORIGIN: origin, SESSION_SECRET: randomBytes(32).toString('base64url'), NODE_ENV: 'test',
    SMTP_HOST: '127.0.0.1', SMTP_PORT: String(process.env.MAILPIT_SMTP_PORT ?? 1026) }, stdio: 'ignore' });
  let ready = false;
  for (let n = 0; n < 50; n++) {
    if (server.exitCode !== null) throw new Error('API de prueba no inició.');
    try { if ((await call('/health/ready')).ok) { ready = true; break; } } catch { /* bounded startup */ }
    await delay(100);
  }
  assert.ok(ready);
  accounts = [];
  for (let n = 0; n < 2; n++) accounts.push(await recruiterLogin(n));
});
after(async () => {
  if (server && server.exitCode === null) { const ended = once(server, 'exit'); server.kill('SIGTERM');
    const timer = setTimeout(() => server.kill('SIGKILL'), 4000); await ended; clearTimeout(timer); }
  if (connection) { assert.equal(connection.name, dbName); try { await connection.dropDatabase(); } finally { await connection.close(); } }
});

test('solo el propietario invita en publicado; duplicado y datos reales se rechazan', async () => {
  const email = `owner-${randomUUID()}@example.test`;
  assert.equal((await invite(email, accounts[0], draft._id.toString())).status, 404);
  assert.equal((await invite(email, accounts[1])).status, 404);
  assert.equal((await invite('real@gmail.com')).status, 422);
  assert.equal((await invite(email)).status, 201);
  assert.equal((await invite(email.toUpperCase())).status, 409);
  const own = await call(`/screenings/${published._id}/invitations`, 'GET', undefined, accounts[0]);
  assert.equal(own.status, 200);
  const list = (await own.json()).invitations;
  assert.ok(list.some((item) => item.candidateEmail === email));
  assert.ok(list.every((item) => !('auth' in item) && !('code' in item)));
  assert.equal((await call(`/screenings/${published._id}/invitations`, 'GET', undefined, accounts[1])).status, 404);
  assert.equal((await call('/candidate/session')).status, 401);
});

test('código Mailpit de un uso, CSRF, principal separado y recarga', async () => {
  const email = `flow-${randomUUID()}@example.test`;
  const invitation = await (await invite(email)).json();
  const csrf = await prelogin();
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, { csrfToken: 'bad', cookie: csrf.cookie })).status, 403);
  const requested = await candidatePost('/access/request', { publicId: invitation.publicId }, csrf);
  assert.equal(requested.status, 200);
  assert.deepEqual(Object.keys(await requested.json()).sort(), ['retryAfterSeconds', 'status']);
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 429);
  const code = await mailCode(email);
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code: 'abcdef' }, csrf)).status, 422);
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code: code === '000000' ? '000001' : '000000' }, csrf)).status, 401);
  const verified = await candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf, accounts[0].cookie);
  assert.equal(verified.status, 200);
  const candidateCookie = cookie(verified, 'sr_session');
  assert.ok(candidateCookie && candidateCookie !== accounts[0].cookie);
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf)).status, 401);
  assert.equal((await call('/screenings', 'GET', undefined, { cookie: candidateCookie })).status, 401);
  assert.equal((await call('/candidate/session', 'GET', undefined, { cookie: accounts[1].cookie })).status, 401);
  const resumed = await call('/candidate/session', 'GET', undefined, { cookie: candidateCookie });
  assert.equal(resumed.status, 200);
  const session = await resumed.json();
  assert.equal(session.publicId, invitation.publicId);
  assert.ok(new Date(session.expiresAt).getTime() - Date.now() <= 2 * 3600000);
  assert.equal((await call('/auth/session', 'GET', undefined, { cookie: candidateCookie })).status, 401);
  assert.equal((await call('/candidate/logout', 'POST', undefined, { cookie: candidateCookie, csrfToken: 'bad' })).status, 403);
  assert.equal((await call('/candidate/logout', 'POST', undefined, { cookie: candidateCookie, csrfToken: session.csrfToken })).status, 200);
  assert.equal((await call('/candidate/session', 'GET', undefined, { cookie: candidateCookie })).status, 401);
});

test('cinco fallos agotan desafío; vencimiento y retención revocan incluso sin TTL', async () => {
  accounts[0] = await recruiterLogin(0);
  const email = `limit-${randomUUID()}@example.test`;
  const invitation = await (await invite(email)).json();
  const csrf = await prelogin();
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 200);
  const code = await mailCode(email);
  const wrong = code === '000000' ? '000001' : '000000';
  for (let n = 0; n < 5; n++) assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code: wrong }, csrf)).status, 401);
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf)).status, 401);
  await models.Invitation.updateOne({ publicId: invitation.publicId }, { $set: { 'auth.failedAttempts': 0,
    'auth.expiresAt': new Date(Date.now() - 1000) } });
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf)).status, 401);
  await models.Invitation.updateOne({ publicId: invitation.publicId }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 404);
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf)).status, 401);
});

test('reenvío invalida el anterior y conserva el límite de cinco por hora', async () => {
  const email = `resend-${randomUUID()}@example.test`;
  const invitation = await (await invite(email)).json();
  const csrf = await prelogin();
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 200);
  const oldCode = await mailCode(email);
  for (let n = 1; n < 5; n++) {
    await models.Invitation.updateOne({ publicId: invitation.publicId }, { $set: { 'auth.lastRequestedAt': new Date(Date.now() - 61000) } });
    assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 200);
  }
  const stored = await models.Invitation.findOne({ publicId: invitation.publicId });
  assert.equal(stored.auth.requestsInWindow, 5);
  await models.Invitation.updateOne({ publicId: invitation.publicId }, { $set: { 'auth.lastRequestedAt': new Date(Date.now() - 61000) } });
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 429);
  assert.equal((await candidatePost('/access/verify', { publicId: invitation.publicId, code: oldCode }, csrf)).status, 401);
});

test('verificaciones concurrentes consumen una sola vez y vigencia revoca la sesión', async () => {
  const email = `race-${randomUUID()}@example.test`;
  const invitation = await (await invite(email)).json();
  const csrf = await prelogin();
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 200);
  const code = await mailCode(email);
  const attempts = await Promise.all([candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf),
    candidatePost('/access/verify', { publicId: invitation.publicId, code }, csrf)]);
  assert.deepEqual(attempts.map((response) => response.status).sort(), [200, 401]);
  const candidateCookie = cookie(attempts.find((response) => response.status === 200), 'sr_session');
  assert.equal((await call('/candidate/session', 'GET', undefined, { cookie: candidateCookie })).status, 200);
  const session = await models.Session.findOne({ invitationId: invitation.id });
  await models.Session.updateOne({ _id: session._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await call('/candidate/session', 'GET', undefined, { cookie: candidateCookie })).status, 401);
  const csrfNew = await prelogin();
  await models.Invitation.updateOne({ publicId: invitation.publicId }, { $set: { 'auth.lastRequestedAt': new Date(Date.now() - 61000) } });
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrfNew)).status, 200);
  const newCode = await mailCode(email);
  const newVerification = await candidatePost('/access/verify', { publicId: invitation.publicId, code: newCode }, csrfNew);
  assert.equal(newVerification.status, 200);
  const renewedCookie = cookie(newVerification, 'sr_session');
  assert.equal((await call('/candidate/session', 'GET', undefined, { cookie: renewedCookie })).status, 200);
  await models.Invitation.updateOne({ publicId: invitation.publicId }, { $set: { purgeAt: new Date(Date.now() - 1000) } });
  assert.equal((await call('/candidate/session', 'GET', undefined, { cookie: renewedCookie })).status, 401);
  assert.equal((await candidatePost('/access/request', { publicId: invitation.publicId }, csrf)).status, 404);
});
