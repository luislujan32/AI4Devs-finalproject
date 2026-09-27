import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

// Only this randomly named test database is written and cleaned by this check.
const database = `screeningroom_smoke_${randomUUID().replaceAll('-', '')}`;
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom';
const probe = createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const api = spawn(process.execPath, ['apps/api/dist/main.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: { ...process.env, API_PORT: String(port), MONGODB_URI: uri, SESSION_SECRET: randomBytes(32).toString('base64url'), NODE_ENV: 'test' },
  stdio: 'ignore',
});
let connection;

try {
  let ready;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (api.exitCode !== null) throw new Error('La API no pudo iniciar; comprobá MongoDB y la compilación.');
    try {
      ready = await fetch(`${origin}/api/health/ready`, { signal: AbortSignal.timeout(2000) });
      if (ready.ok) break;
    } catch { /* Wait for process startup within the bounded loop. */ }
    await delay(250);
  }
  assert.equal(ready?.status, 200, 'Readiness debe confirmar MongoDB real');
  assert.deepEqual(await ready.json(), { status: 'ready', database: 'connected' });

  const page = await fetch(origin);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /<title>Screeningroom<\/title>/);
  const asset = html.match(/src="(\/assets\/[^" ]+\.js)"/)?.[1];
  assert.ok(asset, 'El HTML debe referenciar el frontend compilado');
  const assetResponse = await fetch(`${origin}${asset}`);
  assert.equal(assetResponse.status, 200);
  assert.match(assetResponse.headers.get('content-type'), /javascript/);

  const missing = await fetch(`${origin}/api/not-a-route`);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('content-type'), /json/);

  connection = await mongoose.createConnection(uri, { dbName: database }).asPromise();
  const marker = randomUUID();
  await connection.collection('probes').insertOne({ marker });
  await connection.close();
  connection = await mongoose.createConnection(uri, { dbName: database }).asPromise();
  assert.ok(await connection.collection('probes').findOne({ marker }), 'La escritura debe persistir tras reconectar');

  // Verify the public error contract using the real controller with an isolated
  // connection. This does not stop or alter another development service.
  const { HealthController } = await import('../apps/api/dist/health.controller.js');
  const disconnected = mongoose.createConnection();
  await assert.rejects(new HealthController(disconnected).ready(), (error) => {
    assert.equal(error.getStatus(), 503);
    assert.equal(JSON.stringify(error.getResponse()).includes('mongodb://'), false);
    return true;
  });
  await disconnected.close();
  console.log('OK: readiness real, frontend y recursos, API 404, persistencia tras reconexión y error 503 sin URI.');
} finally {
  try {
    if (connection) {
      assert.equal(connection.name, database);
      assert.ok(database.startsWith('screeningroom_smoke_'));
      try { await connection.dropDatabase(); }
      finally { await connection.close(); }
    }
  } finally {
    if (api.exitCode === null) {
      const stopped = once(api, 'exit');
      api.kill('SIGTERM');
      const timeout = setTimeout(() => api.kill('SIGKILL'), 5000);
      await stopped;
      clearTimeout(timeout);
    }
  }
}
