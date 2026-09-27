import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { provisionRecruiter } from '../apps/api/dist/auth/provision.js';

async function main() {
  const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
  if (!values.email || !values.name || process.stdin.isTTY) throw new Error('Indicá --email y --name; contraseña por stdin, nunca como argumento.');
  let password = '';
  for await (const chunk of process.stdin) {
    password += chunk.toString();
    if (password.length > 130) throw new Error('Contraseña demasiado larga.');
  }
  password = password.replace(/\r?\n$/, '');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom', {
    serverSelectionTimeoutMS: 3000,
  }).asPromise();
  try {
    await provisionRecruiter(connection, values.email, values.name, password);
    console.log('Recruiter creado; no se reemplazan cuentas existentes.');
  } finally { password = ''; await connection.close(); }
}

main().catch(() => {
  console.error("No se pudo completar el provisioning. Revisá argumentos, destino y archivo local; no se reemplazan cuentas existentes.");
  process.exitCode = 1;
});
