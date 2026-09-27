import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { loadFixtures } from '../apps/api/dist/persistence/fixtures.js';

const { values } = parseArgs({ options: { database: { type: 'string' } } });
if (!values.database || !/^screeningroom_fixtures_[a-z0-9_]+$/.test(values.database)) {
  throw new Error('Indicá --database screeningroom_fixtures_<nombre>; nunca la BD de desarrollo o producción.');
}
const connection = await mongoose.createConnection(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom', {
  dbName: values.database, serverSelectionTimeoutMS: 3000,
}).asPromise();
try {
  await loadFixtures(connection);
  console.log('Fixtures ficticios cargados sin reemplazar documentos existentes; usuario inactivo.');
} finally {
  await connection.close();
}
