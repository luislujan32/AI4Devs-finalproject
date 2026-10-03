import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { isObjectIdOrHexString, type Connection } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { domainModels } from '../persistence/models.js';
import { expectedRevision, invalid, object, parseDraft, publicationIssues, type DraftInput, type DraftQuestion } from './validation.js';

@Injectable()
export class ScreeningsService {
  private readonly models;
  constructor(@InjectConnection() connection: Connection) { this.models = domainModels(connection); }
  private async owned(ownerId: string, id: string) {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException('Screening no encontrado.');
    const row = await this.models.Screening.findOne({ _id: id, ownerId });
    if (!row) throw new NotFoundException('Screening no encontrado.');
    return row;
  }
  private view(row: { toObject(): { _id: { toString(): string }; ownerId: unknown; [key: string]: unknown } }) {
    const { _id, ownerId, ...data } = row.toObject(); void ownerId;
    return { id: _id.toString(), ...data };
  }
  async list(ownerId: string) {
    const rows = await this.models.Screening.find({ ownerId }).sort({ createdAt: -1, _id: -1 }).limit(100)
      .select('_id title area status revision createdAt').lean();
    return { screenings: rows.map((row) => ({ id: row._id.toString(), title: row.title ?? 'Sin título', area: row.area ?? '',
      status: row.status, revision: row.revision, createdAt: row.createdAt })) };
  }
  async detail(ownerId: string, id: string) { return this.view(await this.owned(ownerId, id)); }
  async create(ownerId: string, body: unknown) {
    const input = parseDraft(body);
    if (input.questions.some((q) => q.bankQuestionId)) invalid('Agregá las preguntas del banco mediante la acción correspondiente.');
    return this.view(await this.models.Screening.create({ ...input, ownerId, status: 'draft', revision: 0 }));
  }
  async save(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id);
    const input = parseDraft(body, true);
    for (const q of input.questions) if (q.bankQuestionId && !row.questions.some((prior) => prior.id === q.id && prior.bankQuestionId?.toString() === q.bankQuestionId)) invalid('La referencia al banco no corresponde a una copia existente.');
    return this.replace(ownerId, id, input.expectedRevision!, input);
  }
  async remove(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id);
    const input = object(body, ['expectedRevision']);
    const revision = expectedRevision(input.expectedRevision);
    if (row.status !== 'draft') throw new ConflictException('Solo se pueden eliminar borradores.');
    const deleted = await this.models.Screening.findOneAndDelete({ _id: id, ownerId, status: 'draft', revision });
    if (!deleted) throw new ConflictException('El borrador cambió. Recargá antes de eliminarlo.');
  }
  private async replace(ownerId: string, id: string, revision: number, input: DraftInput) {
    const filter = { _id: id, ownerId, status: 'draft' as const, revision };
    const row = await this.models.Screening.findOne(filter);
    if (!row) throw new ConflictException('El screening cambió o ya está publicado. Recargá antes de continuar.');
    const fields = ['title', 'area', 'description', 'threshold', 'questions'] as const;
    for (const field of fields) row.set(field, input[field]);
    try { await row.validate(); } catch { invalid('Revisá los campos y opciones del borrador.'); }
    const data = row.toObject();
    const set: Record<string, unknown> = { revision: revision + 1 };
    const unset: Record<string, 1> = {};
    for (const field of fields) { if (data[field] === undefined) unset[field] = 1; else set[field] = data[field]; }
    const updated = await this.models.Screening.findOneAndUpdate(filter, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ConflictException('El screening cambió. Recargá antes de continuar.');
    return this.view(updated);
  }
  async publish(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id);
    const input = object(body, ['expectedRevision', 'confirmConfiguration']);
    const revision = expectedRevision(input.expectedRevision);
    if (row.status !== 'draft' || row.revision !== revision) throw new ConflictException('El screening cambió o ya está publicado. Recargá antes de continuar.');
    if (input.confirmConfiguration !== true) invalid('Confirmá que revisaste la configuración y el umbral.');
    // Reparse stored configuration to apply the same strict bounds as HTTP input.
    const draft = parseDraft({ title: row.title, area: row.area, description: row.description, threshold: row.threshold,
      questions: row.questions.map((q) => { const value = q.toObject(); return { ...value, ...(q.bankQuestionId ? { bankQuestionId: q.bankQuestionId.toString() } : {}) }; }) });
    const issues = publicationIssues(draft);
    if (issues.length) throw new UnprocessableEntityException({ message: 'No se puede publicar todavía.', issues });
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'draft', revision },
      { $set: { status: 'published', publishedAt: new Date(), revision: revision + 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ConflictException('El screening cambió. Recargá antes de continuar.');
    return { id: updated._id.toString(), status: updated.status, revision: updated.revision, publishedAt: updated.publishedAt };
  }
  async close(ownerId: string, id: string, body: unknown) {
    await this.owned(ownerId, id);
    const input = object(body, ['expectedRevision', 'confirmClosure']);
    const revision = expectedRevision(input.expectedRevision);
    if (input.confirmClosure !== true) invalid('Confirmá el cierre del screening.');
    const closedAt = new Date();
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'published', revision },
      { $set: { status: 'closed', closedAt }, $inc: { revision: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ConflictException('El screening cambió o ya está cerrado. Recargá antes de continuar.');
    return { id: updated._id.toString(), status: updated.status, revision: updated.revision, closedAt: updated.closedAt };
  }
  async copy(ownerId: string, id: string, body: unknown) {
    const source = await this.owned(ownerId, id); object(body ?? {}, []);
    if (!['published', 'closed'].includes(source.status)) throw new ConflictException('Solo se copian screenings publicados o cerrados.');
    const questions = source.questions.map((q) => {
      const ids = new Map(q.options.map((o) => [o.id, randomUUID()]));
      return { ...q.toObject(), id: randomUUID(), options: q.options.map((o) => ({ ...o.toObject(), id: ids.get(o.id)! })),
        ...(q.exclusion ? { exclusion: { acceptedOptionIds: q.exclusion.acceptedOptionIds?.map((id) => ids.get(id)!) ?? [] } } : {}) };
    });
    return this.view(await this.models.Screening.create({ ownerId, title: source.title ? `${source.title.slice(0, 112)} (copia)` : 'Copia',
      area: source.area, description: source.description, threshold: source.threshold, questions, status: 'draft', revision: 0 }));
  }
  async bank(area?: unknown) {
    if (area !== undefined && (typeof area !== 'string' || area.length > 120)) invalid('Área inválida.');
    const rows = await this.models.BankQuestion.find({ active: true, ...(area ? { area } : {}) }).sort({ area: 1, _id: 1 }).limit(100).lean();
    return { questions: rows.map(({ _id, active, createdAt, updatedAt, ...question }) => { void active; void createdAt; void updatedAt; return { id: _id.toString(), ...question }; }) };
  }
  async fromBank(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id);
    const input = object(body, ['expectedRevision', 'bankQuestionId']);
    const revision = expectedRevision(input.expectedRevision);
    if (row.status !== 'draft' || row.revision !== revision) throw new ConflictException('El screening cambió o ya está publicado.');
    if (typeof input.bankQuestionId !== 'string' || !isObjectIdOrHexString(input.bankQuestionId)) throw new NotFoundException('Pregunta del banco no disponible.');
    const entry = await this.models.BankQuestion.findOne({ _id: input.bankQuestionId, active: true });
    if (!entry) throw new NotFoundException('Pregunta del banco no disponible.');
    const questions = row.questions.map((q) => { const value = q.toObject(); return { ...value, ...(q.bankQuestionId ? { bankQuestionId: q.bankQuestionId.toString() } : {}) } as DraftQuestion; });
    questions.push({ id: randomUUID(), bankQuestionId: entry._id.toString(), criterion: entry.criterion, text: entry.text,
      type: entry.type as DraftQuestion['type'], required: false, scored: false,
      options: entry.options.map((option) => ({ id: randomUUID(), label: option.label })), guidance: entry.guidance ?? undefined });
    const draft = parseDraft({ title: row.title, area: row.area, description: row.description, threshold: row.threshold, questions });
    return this.replace(ownerId, id, revision, draft);
  }
}
