import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { loadCatalog } from '../apps/api/dist/screenings/catalog.js';

async function main() {
  const { values } = parseArgs({ options: { database: { type: 'string' }, file: { type: 'string', default: 'data/question-bank.initial.json' } } });
  if (!values.database || !/^screeningroom_demo_[a-z0-9_]+$/.test(values.database)) throw new Error('Destino inválido.');
  const catalog = JSON.parse(await readFile(values.file, 'utf8'));
  if (catalog.review?.status !== 'approved') throw new Error('Revisión pendiente.');
  const connection = await mongoose.createConnection(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom', {
    dbName: values.database, serverSelectionTimeoutMS: 3000,
  }).asPromise();
  try { await loadCatalog(connection, catalog); console.log('Catálogo revisado cargado; entradas existentes conservadas.'); }
  finally { await connection.close(); }
}
main().catch(() => { console.error('No se pudo cargar el catálogo. Revisá aprobación, archivo y destino; no se reemplazan entradas existentes.'); process.exitCode = 1; });
