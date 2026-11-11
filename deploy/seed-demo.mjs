import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { provisionRecruiter } from '../apps/api/dist/auth/provision.js';
import { verifyPassword } from '../apps/api/dist/auth/passwords.js';
import { domainModels } from '../apps/api/dist/persistence/models.js';
import { loadCatalog } from '../apps/api/dist/screenings/catalog.js';

const database = 'screeningroom_demo_public';
const email = 'revisor@example.test';
const { PUBLIC_ORIGIN, MONGODB_URI, SESSION_SECRET, DEMO_RECRUITER_PASSWORD, DEMO_MAIL_PASSWORD } = process.env;

async function seed() {
  const origin = new URL(PUBLIC_ORIGIN);
  const uri = new URL(MONGODB_URI);
  if (origin.protocol !== 'https:' || origin.origin !== PUBLIC_ORIGIN ||
    !['mongodb:', 'mongodb+srv:'].includes(uri.protocol) || uri.pathname !== `/${database}` ||
    !SESSION_SECRET || SESSION_SECRET.length < 32 ||
    !/^[A-Za-z0-9_+/=-]{16,128}$/.test(DEMO_RECRUITER_PASSWORD ?? '') ||
    !/^[A-Za-z0-9_+/=-]{16,128}$/.test(DEMO_MAIL_PASSWORD ?? '') ||
    new Set([SESSION_SECRET, DEMO_RECRUITER_PASSWORD, DEMO_MAIL_PASSWORD]).size !== 3) {
    throw new Error('Configuración de demo inválida.');
  }

  const catalog = JSON.parse(await readFile(new URL('../data/question-bank.initial.json', import.meta.url), 'utf8'));
  const connection = await mongoose.createConnection(MONGODB_URI, { serverSelectionTimeoutMS: 8000 }).asPromise();
  try {
    if (connection.name !== database) throw new Error('Base de demo inesperada.');
    const models = domainModels(connection);
    await Promise.all(Object.values(models).map((model) => model.init()));
    const existing = await models.User.findOne({ email }).select('+passwordHash');
    if (existing) {
      if (!existing.active || !await verifyPassword(existing.passwordHash, DEMO_RECRUITER_PASSWORD)) {
        throw new Error('La cuenta de revisión existente no coincide.');
      }
    } else {
      await provisionRecruiter(connection, email, 'Revisor de demo', DEMO_RECRUITER_PASSWORD);
    }
    await loadCatalog(connection, catalog);
    console.log('Cuenta de revisión y banco preparados.');
  } finally { await connection.close(); }
}

seed().catch(() => {
  console.error('No se pudo preparar la demo. Revisá HTTPS, secretos, acceso a la base de demo y credenciales existentes.');
  process.exitCode = 1;
});
