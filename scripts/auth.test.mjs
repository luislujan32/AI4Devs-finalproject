import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import mongoose from 'mongoose';
import { domainModels } from '../apps/api/dist/persistence/models.js';
import { provisionDemo, demoEmails } from '../apps/api/dist/auth/provision.js';
import { provisionRecruiter } from '../apps/api/dist/auth/provision.js';
import { AuthService } from '../apps/api/dist/auth/auth.service.js';

const database = `screeningroom_demo_test_${randomUUID().replaceAll('-', '')}`;
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom';
const secret = randomBytes(32).toString('base64url');
const passwords = [randomBytes(24).toString('base64url'), randomBytes(24).toString('base64url')];
let connection, models, api, origin, port;
const cookie = (response, name) => response.headers.getSetCookie().find((value) => value.startsWith(`${name}=`))?.split(';')[0];
const request = (path, options = {}) => fetch(`${origin}/api${path}`, options);
async function start() {
  api = spawn(process.execPath, ['apps/api/dist/main.js'], { env: { ...process.env, MONGODB_URI: process.env.T02_TEST_URI, API_PORT: String(port),
    SESSION_SECRET: secret, PUBLIC_ORIGIN: origin, NODE_ENV: 'test' }, stdio: 'ignore' });
  for (let n = 0; n < 50; n++) {
    if (api.exitCode !== null) throw new Error('La API no pudo iniciar.');
    try { if ((await request('/health/ready')).ok) return; } catch { /* bounded startup */ }
    await delay(100);
  }
  throw new Error('La API no confirmó disponibilidad.');
}
async function stop() {
  if (api && api.exitCode === null) {
    const ended = once(api, 'exit'); api.kill('SIGTERM');
    const timer = setTimeout(() => api.kill('SIGKILL'), 4000);
    await ended; clearTimeout(timer);
  }
}
async function prelogin() {
  const response = await request('/auth/csrf');
  assert.equal(response.status, 200);
  return { token: (await response.json()).csrfToken, cookie: cookie(response, 'sr_csrf') };
}
async function login(index = 0, previous = '') {
  const csrf = await prelogin();
  const response = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json',
    Origin: origin, 'X-CSRF-Token': csrf.token, Cookie: [csrf.cookie, previous].filter(Boolean).join('; ') },
    body: JSON.stringify({ email: demoEmails[index], password: passwords[index] }) });
  assert.equal(response.status, 200);
  return { cookie: cookie(response, 'sr_recruiter_session'), data: await response.json(), headers: response.headers };
}

before(async () => {
  // Explicit dbName in both processes ensures tests never use the development DB.
  const parsed = new URL(uri); parsed.pathname = `/${database}`;
  connection = await mongoose.createConnection(parsed.toString(), { serverSelectionTimeoutMS: 3000 }).asPromise();
  models = domainModels(connection);
  await provisionDemo(connection, passwords);
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  port = probe.address().port; await new Promise((resolve) => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  // Preserve authentication parameters/options from the supplied URI.
  const apiUri = parsed.toString();
  process.env.T02_TEST_URI = apiUri;
  // start() reads this exact isolated URI below.
  await start();
});
after(async () => {
  await stop();
  if (connection) {
    assert.equal(connection.name, database);
    try { await connection.dropDatabase(); } finally { await connection.close(); }
  }
  delete process.env.T02_TEST_URI;
});

test('provisioning de demo repetible, hashes Argon2id y datos ajenos preservados', async () => {
  const outsider = await models.User.create({ email: 'outsider@example.test', passwordHash: '!disabled', displayName: 'Ajeno', active: false });
  await provisionDemo(connection, passwords);
  assert.equal(await models.User.countDocuments(), 3);
  assert.ok(await models.User.findById(outsider._id));
  const user = await models.User.findOne({ email: demoEmails[0] }).select('+passwordHash');
  assert.match(user.passwordHash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  await assert.rejects(provisionRecruiter(connection, demoEmails[0], 'Duplicado', randomBytes(24).toString('base64url')), (error) => error.code === 11000);
});
test('sesión ausente o cookie falsificada recibe 401', async () => {
  assert.equal((await request('/screenings')).status, 401);
  assert.equal((await request('/auth/session', { headers: { Cookie: `sr_recruiter_session=${randomBytes(32).toString('base64url')}` } })).status, 401);
});
test('login rechaza origen/token ausentes, distintos y multibyte sin crear sesión', async () => {
  const csrf = await prelogin();
  const base = { 'Content-Type': 'application/json', Cookie: csrf.cookie, Origin: origin, 'X-CSRF-Token': csrf.token };
  for (const headers of [{ ...base, Origin: 'https://foreign.example' }, { ...base, 'X-CSRF-Token': 'ñ'.repeat(43) },
    { 'Content-Type': 'application/json', Origin: origin }]) {
    const response = await request('/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: demoEmails[0], password: passwords[0] }) });
    assert.equal(response.status, 403);
  }
  assert.equal(await models.Session.countDocuments(), 0);
});
test('credenciales inexistentes, incorrectas e inactivas devuelven el mismo 401', async () => {
  const inactive = await provisionRecruiter(connection, 'inactive@example.test', 'Inactivo', passwords[1]);
  await models.User.updateOne({ _id: inactive._id }, { $set: { active: false } });
  const bodies = [];
  for (const [email, password] of [['missing@example.test', passwords[0]], [demoEmails[0], 'incorrecta'], ['inactive@example.test', passwords[1]]]) {
    const csrf = await prelogin();
    const response = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin,
      Cookie: csrf.cookie, 'X-CSRF-Token': csrf.token }, body: JSON.stringify({ email, password }) });
    assert.equal(response.status, 401); bodies.push(await response.json());
  }
  assert.deepEqual(bodies[0], bodies[1]); assert.deepEqual(bodies[1], bodies[2]);
});
test('dos recruiters ven solo sus screenings y ajenos son 404', async () => {
  const a = await login(0), b = await login(1);
  const rowsA = (await (await request('/screenings', { headers: { Cookie: a.cookie } })).json()).screenings;
  const rowsB = (await (await request('/screenings', { headers: { Cookie: b.cookie } })).json()).screenings;
  assert.equal(rowsA.length, 1); assert.equal(rowsB.length, 1);
  assert.equal(rowsA[0].title, 'Screening ficticio A'); assert.equal(rowsB[0].title, 'Screening ficticio B');
  assert.equal((await request(`/screenings/${rowsA[0].id}`, { headers: { Cookie: a.cookie } })).status, 200);
  const foreign = await request(`/screenings/${rowsB[0].id}`, { headers: { Cookie: a.cookie } });
  const missing = await request(`/screenings/${new mongoose.Types.ObjectId()}`, { headers: { Cookie: a.cookie } });
  assert.equal(foreign.status, 404); assert.deepEqual(await foreign.json(), await missing.json());
  assert.equal((await request('/screenings/not-an-id', { headers: { Cookie: a.cookie } })).status, 404);
  assert.match(a.headers.getSetCookie().find((value) => value.startsWith('sr_recruiter_session=')), /HttpOnly; SameSite=Lax/i);
  assert.equal(a.headers.get('cache-control'), 'no-store');
  assert.equal('passwordHash' in a.data.user, false); assert.equal('sessionId' in a.data, false);
  const session = await models.Session.findOne({ userId: a.data.user.id }).select('+sessionId');
  assert.notEqual(session.sessionId, a.cookie.split('=')[1]);
  assert.ok(new Date(a.data.expiresAt).getTime() - Date.now() <= 8 * 3600000);
});
test('logout exige origen/CSRF y revoca la cookie de servidor', async () => {
  const a = await login(0);
  for (const headers of [{ Cookie: a.cookie, Origin: origin }, { Cookie: a.cookie, Origin: 'https://foreign.example', 'X-CSRF-Token': a.data.csrfToken }]) {
    assert.equal((await request('/auth/logout', { method: 'POST', headers })).status, 403);
  }
  assert.equal((await request('/auth/session', { headers: { Cookie: a.cookie } })).status, 200);
  const response = await request('/auth/logout', { method: 'POST', headers: { Cookie: a.cookie, Origin: origin, 'X-CSRF-Token': a.data.csrfToken } });
  assert.equal(response.status, 200); assert.match(response.headers.getSetCookie()[0], /Max-Age=0/);
  assert.equal((await request('/auth/session', { headers: { Cookie: a.cookie } })).status, 401);
});
test('reautenticación rota cookie e invalida la anterior', async () => {
  const first = await login(1); const second = await login(1, first.cookie);
  assert.notEqual(first.cookie, second.cookie);
  assert.equal((await request('/auth/session', { headers: { Cookie: first.cookie } })).status, 401);
  assert.equal((await request('/auth/session', { headers: { Cookie: second.cookie } })).status, 200);
});
test('sesión vencida/candidata e inactivación niegan acceso antes del TTL', async () => {
  const a = await login(0);
  await models.Session.updateMany({ userId: a.data.user.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await request('/screenings', { headers: { Cookie: a.cookie } })).status, 401);
  const b = await login(1);
  await models.Session.updateMany({ userId: b.data.user.id }, { $set: { principal: 'candidate', invitationId: new mongoose.Types.ObjectId() }, $unset: { userId: '' } });
  assert.equal((await request('/screenings', { headers: { Cookie: b.cookie } })).status, 401);
  const active = await login(0);
  await models.User.updateOne({ _id: active.data.user.id }, { $set: { active: false } });
  assert.equal((await request('/auth/session', { headers: { Cookie: active.cookie } })).status, 401);
  await models.User.updateOne({ _id: active.data.user.id }, { $set: { active: true } });
});
test('reinicio conserva sesión/vencimiento y límites persistentes', async () => {
  const a = await login(1);
  await stop(); await start();
  const response = await request('/auth/session', { headers: { Cookie: a.cookie } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).expiresAt, a.data.expiresAt);
  assert.ok(await connection.collection('auth_limits').countDocuments());
});
test('rate limit por correo devuelve 429 y no guarda email/IP en claro', async () => {
  const csrf = await prelogin();
  const statuses = [];
  for (let n = 0; n < 11; n++) statuses.push((await request('/auth/login', { method: 'POST', headers: {
    'Content-Type': 'application/json', Origin: origin, Cookie: csrf.cookie, 'X-CSRF-Token': csrf.token },
    body: JSON.stringify({ email: 'limited@example.test', password: 'incorrecta' }) })).status);
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401)); assert.equal(statuses[10], 429);
  const stored = await connection.collection('auth_limits').find().toArray();
  assert.equal(JSON.stringify(stored).includes('limited@example.test'), false);
  assert.ok(stored.every((entry) => Object.keys(entry).every((key) => ['_id', 'count', 'expiresAt'].includes(key))));
});

test('preacceso vencido o firma alterada recibe 403', async () => {
  const token = randomBytes(32).toString('base64url');
  const issued = String(Date.now() - 16 * 60000);
  const tag = createHmac('sha256', secret).update(`csrf:${token}:${issued}`).digest('base64url');
  for (const value of [`${token}.${issued}.${tag}`, `${token}.${Date.now()}.incorrecta`]) {
    const response = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json',
      Origin: origin, Cookie: `sr_csrf=${value}`, 'X-CSRF-Token': token },
      body: JSON.stringify({ email: demoEmails[0], password: passwords[0] }) });
    assert.equal(response.status, 403);
  }
});
test('límite por IP impide eludir la protección cambiando de correo', async () => {
  // Only reset counters belonging to this disposable isolated test database.
  await connection.collection('auth_limits').deleteMany({});
  const csrf = await prelogin();
  const statuses = [];
  for (let n = 0; n < 51; n++) statuses.push((await request('/auth/login', { method: 'POST', headers: {
    'Content-Type': 'application/json', Origin: origin, Cookie: csrf.cookie, 'X-CSRF-Token': csrf.token },
    body: JSON.stringify({ email: `ip-limit-${n}@example.test`, password: 'incorrecta' }) })).status);
  assert.deepEqual(statuses.slice(0, 50), Array(50).fill(401));
  assert.equal(statuses[50], 429);
});

test('producción requiere HTTPS y cookie Secure; claves ausentes fallan', () => {
  const previous = { SESSION_SECRET: process.env.SESSION_SECRET, PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN, NODE_ENV: process.env.NODE_ENV };
  try {
    process.env.SESSION_SECRET = '';
    assert.throws(() => new AuthService(connection), /SESSION_SECRET/);
    process.env.SESSION_SECRET = secret; process.env.NODE_ENV = 'production'; process.env.PUBLIC_ORIGIN = 'http://example.test';
    assert.throws(() => new AuthService(connection), /HTTPS/);
    process.env.PUBLIC_ORIGIN = 'https://example.test';
    const headers = [];
    new AuthService(connection).prelogin({ append: (_name, value) => headers.push(value), setHeader: () => {} });
    assert.match(headers[0], /Secure/); assert.match(headers[0], /HttpOnly/);
  } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
