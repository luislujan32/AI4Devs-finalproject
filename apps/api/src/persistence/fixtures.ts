import { Types, type Connection } from 'mongoose';
import { domainModels } from './models.js';

export const fixtureIds = {
  user: new Types.ObjectId('640000000000000000000001'),
  bank: new Types.ObjectId('640000000000000000000002'),
  screening: new Types.ObjectId('640000000000000000000003'),
  invitation: new Types.ObjectId('640000000000000000000004'),
};

// Only an explicitly named fixture database is eligible. Never seed at startup.
export async function loadFixtures(connection: Connection) {
  if (!/^screeningroom_fixtures_[a-z0-9_]+$/.test(connection.name)) {
    throw new Error('Los fixtures requieren una BD screeningroom_fixtures_<nombre>.');
  }
  const models = domainModels(connection);
  await Promise.all(Object.values(models).map((model) => model.init()));
  const entries = [
    { model: models.User, data: { _id: fixtureIds.user, email: 't01-recruiter@example.test',
      passwordHash: '!fixture-disabled', displayName: 'Recruiter ficticio T-01', active: false } },
    { model: models.BankQuestion, data: { _id: fixtureIds.bank, area: 'Tecnología', criterion: 'Experiencia declarada',
      text: 'Pregunta ficticia: ¿has trabajado con herramientas web?', type: 'boolean', active: true,
      options: [{ id: 'yes', label: 'Sí' }, { id: 'no', label: 'No' }], guidance: 'Dato de prueba, sin verificación profesional.' } },
    { model: models.Screening, data: { _id: fixtureIds.screening, ownerId: fixtureIds.user, title: 'Screening ficticio T-01',
      area: 'Tecnología', status: 'published', revision: 1, threshold: 70, publishedAt: new Date('2026-01-01T00:00:00Z'),
      questions: [{ id: 'fixture-q1', bankQuestionId: fixtureIds.bank, criterion: 'Experiencia declarada',
        text: 'Pregunta ficticia: ¿has trabajado con herramientas web?', type: 'boolean', required: true, scored: true, weight: 1,
        options: [{ id: 'yes', label: 'Sí', score: 100 }, { id: 'no', label: 'No', score: 0 }],
        guidance: 'Dato de prueba, sin verificación profesional.' }] } },
    { model: models.Invitation, data: { _id: fixtureIds.invitation, ownerId: fixtureIds.user, screeningId: fixtureIds.screening,
      publicId: 'fixture-t01-not-a-live-invitation', candidateEmail: 't01-candidate@example.test', candidateName: 'Persona ficticia T-01',
      expiresAt: new Date('2099-01-01T00:00:00Z'), purgeAt: new Date('2099-04-01T00:00:00Z') } },
  ];
  // Preflight all reserved ids before writing. A collision is a stop, not a reset.
  for (const { model, data } of entries) {
    const existing = await connection.collection(model.collection.name).findOne({ _id: data._id });
    if (existing) {
      const identity = 'email' in data ? 'email' : 'publicId' in data ? 'publicId' : 'title' in data ? 'title' : 'text';
      if (existing[identity] !== data[identity as keyof typeof data]) throw new Error('Colisión de fixture: no se modificaron datos ajenos.');
    }
  }
  for (const { model, data } of entries) {
    // Validate documents before the insert-only update; upsert validators alone
    // would not execute all nested document hooks.
    const validated = new model(data);
    await validated.validate();
    const document = validated.toObject();
    await connection.collection(model.collection.name).updateOne({ _id: data._id }, {
      $setOnInsert: { ...document, createdAt: new Date(), updatedAt: new Date() },
    }, { upsert: true });
  }
  return fixtureIds;
}
