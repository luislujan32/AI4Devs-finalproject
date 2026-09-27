import { parseArgs } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { demoEmails, provisionDemo } from '../apps/api/dist/auth/provision.js';

async function main() {
  const { values } = parseArgs({ options: { database: { type: 'string' } } });
  if (!values.database || !/^screeningroom_demo_[a-z0-9_]+$/.test(values.database)) throw new Error('Indicá --database screeningroom_demo_<nombre>.');
  await mkdir('.local', { recursive: true, mode: 0o700 });
  const path = `.local/demo-${values.database}.json`;
  let credentials;
  try { credentials = JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    credentials = demoEmails.map((email) => ({ email, password: randomBytes(24).toString('base64url') }));
    await writeFile(path, JSON.stringify(credentials, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  }
  if (!Array.isArray(credentials) || credentials.length !== 2 || credentials.some((entry, n) => entry.email !== demoEmails[n] || typeof entry.password !== 'string')) {
    throw new Error('Archivo local de demo inválido.');
  }
  const connection = await mongoose.createConnection(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom', {
    dbName: values.database, serverSelectionTimeoutMS: 3000,
  }).asPromise();
  try {
    await provisionDemo(connection, credentials.map((entry) => entry.password));
    console.log(`Demo ficticia preparada. Credenciales únicamente en ${path}; no se imprimen contraseñas.`);
  } finally { await connection.close(); }
}

main().catch(() => {
  console.error("No se pudo completar el provisioning. Revisá argumentos, destino y archivo local; no se reemplazan cuentas existentes.");
  process.exitCode = 1;
});
