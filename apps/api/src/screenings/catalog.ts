import { Types, type Connection } from 'mongoose';
import { domainModels } from '../persistence/models.js';
import { object, invalid } from './validation.js';

export const catalogAreas = ['Comercio y atención al cliente', 'Administración y operaciones', 'Tecnología'];
export async function loadCatalog(connection: Connection, value: unknown) {
  if (!/^screeningroom_demo_[a-z0-9_]+$/.test(connection.name)) invalid('Destino de catálogo no autorizado.');
  const catalog = object(value, ['review', 'questions']);
  const review = object(catalog.review, ['status', 'reviewer', 'reviewedAt']);
  if (review.status !== 'approved' || typeof review.reviewer !== 'string' || !review.reviewer.trim()
    || typeof review.reviewedAt !== 'string' || !Number.isFinite(Date.parse(review.reviewedAt))) invalid('El catálogo requiere revisión humana antes de cargar.');
  if (!Array.isArray(catalog.questions) || catalog.questions.length !== 15) invalid('El catálogo inicial debe tener quince preguntas.');
  const { BankQuestion } = domainModels(connection);
  const documents = catalog.questions.map((entry) => {
    const q = object(entry, ['_id', 'area', 'criterion', 'text', 'type', 'options', 'guidance', 'active']);
    if (typeof q._id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(q._id) || typeof q.area !== 'string' || !catalogAreas.includes(q.area)
      || q.active !== true || typeof q.criterion !== 'string' || !q.criterion.trim() || typeof q.text !== 'string' || !q.text.trim()
      || typeof q.guidance !== 'string' || !q.guidance.trim() || q.guidance.length > 2000 || !Array.isArray(q.options)) invalid('Entrada de catálogo inválida.');
    for (const option of q.options) {
      const o = object(option, ['id', 'label']);
      if (typeof o.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(o.id) || typeof o.label !== 'string' || !o.label.trim() || o.label.length > 300) invalid();
    }
    if (q.type === 'text' ? q.options.length !== 0 : q.type === 'boolean' ? q.options.length !== 2
      : q.type !== 'single_choice' || q.options.length < 2 || q.options.length > 8) invalid('Opciones de catálogo inválidas.');
    return new BankQuestion({ ...q, _id: new Types.ObjectId(q._id) });
  });
  if (new Set(documents.map((q) => q._id.toString())).size !== 15 || catalogAreas.some((area) => documents.filter((q) => q.area === area).length !== 5)) invalid('Distribución de catálogo inválida.');
  await Promise.all(documents.map((document) => document.validate()));
  await BankQuestion.init();
  const fields = ['area', 'criterion', 'text', 'type', 'options', 'guidance', 'active'] as const;
  // Preflight the whole catalog before the first insertion; never overwrite an edited entry.
  for (const document of documents) {
    const existing = await BankQuestion.findById(document._id);
    if (existing && fields.some((field) => JSON.stringify(existing.toObject()[field]) !== JSON.stringify(document.toObject()[field]))) invalid('Colisión de catálogo: no se reemplazan entradas existentes.');
  }
  for (const document of documents) {
    const now = new Date();
    await BankQuestion.collection.updateOne({ _id: document._id }, { $setOnInsert: { ...document.toObject(), createdAt: now, updatedAt: now } }, { upsert: true });
  }
  return { count: documents.length };
}
