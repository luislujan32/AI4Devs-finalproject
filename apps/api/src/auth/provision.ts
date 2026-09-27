import { Types, type Connection } from 'mongoose';
import { domainModels } from '../persistence/models.js';
import { hashPassword, verifyPassword } from './passwords.js';

export async function provisionRecruiter(connection: Connection, email: string, displayName: string, password: string) {
  if (password.length < 12 || password.length > 128 || !displayName.trim()) throw new Error('Datos de provisioning inválidos.');
  const { User } = domainModels(connection);
  await User.init();
  return User.create({ email, displayName, passwordHash: await hashPassword(password), active: true });
}
export const demoEmails = ['recruiter.a@example.test', 'recruiter.b@example.test'];
export async function provisionDemo(connection: Connection, passwords: string[]) {
  if (!/^screeningroom_demo_[a-z0-9_]+$/.test(connection.name) || passwords.length !== 2
    || passwords.some((password) => password.length < 12 || password.length > 128)) throw new Error('Destino o cuentas de demo inválidos.');
  const models = domainModels(connection);
  await Promise.all(Object.values(models).map((model) => model.init()));
  for (let n = 0; n < 2; n++) {
    const userId = new Types.ObjectId(`65000000000000000000000${n + 1}`);
    const screeningId = new Types.ObjectId(`65000000000000000000000${n + 3}`);
    const existing = await models.User.findById(userId).select('+passwordHash');
    if (existing && (existing.email !== demoEmails[n] || !await verifyPassword(existing.passwordHash, passwords[n]))) {
      throw new Error('La cuenta de demo existente no coincide; no se reemplazaron credenciales.');
    }
    const screening = await models.Screening.findById(screeningId);
    if (screening && screening.ownerId.toString() !== userId.toString()) throw new Error('Colisión de datos de demo.');
    if (!existing) await models.User.create({ _id: userId, email: demoEmails[n], displayName: `Recruiter demo ${n === 0 ? 'A' : 'B'}`,
      passwordHash: await hashPassword(passwords[n]), active: true });
    if (!screening) await models.Screening.create({ _id: screeningId, ownerId: userId,
      title: `Screening ficticio ${n === 0 ? 'A' : 'B'}`, area: 'Tecnología', status: 'draft' });
  }
}
