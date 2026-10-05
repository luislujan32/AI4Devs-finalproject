import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Types, type Connection } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { configurationFor } from './configuration.js';
import { domainModels } from '../persistence/models.js';
import { enumQuery, pageQuery, searchQuery } from '../persistence/list-query.js';
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
  async list(ownerId: string, query: Record<string, unknown> = {}) {
    const { page, pageSize } = pageQuery(query);
    const status = enumQuery(query.status, ['draft', 'published', 'closed'], 'estado');
    const search = searchQuery(query.search);
    const filter = { ownerId, ...(status ? { status } : {}), ...(search ? { title: search } : {}) };
    const now = new Date();
    const [rows, total, draft, published, closed, pendingReview] = await Promise.all([
      this.models.Screening.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize)
        .select('_id title area status revision createdAt updatedAt configurationVersion editingDraft.title').lean(),
      this.models.Screening.countDocuments(filter),
      this.models.Screening.countDocuments({ ownerId, status: 'draft' }),
      this.models.Screening.countDocuments({ ownerId, status: 'published' }),
      this.models.Screening.countDocuments({ ownerId, status: 'closed' }),
      this.models.Invitation.countDocuments({ ownerId, purgeAt: { $gt: now }, status: 'submitted', 'review.decision': { $exists: false } }),
    ]);
    const counts = rows.length ? await this.models.Invitation.aggregate<{ _id: string; invited: number; pendingReview: number }>([
      { $match: { ownerId: new Types.ObjectId(ownerId), screeningId: { $in: rows.map((row) => row._id) }, purgeAt: { $gt: now } } },
      { $group: { _id: '$screeningId', invited: { $sum: 1 }, pendingReview: { $sum: { $cond: [
        { $and: [{ $eq: ['$status', 'submitted'] }, { $eq: [{ $ifNull: ['$review.decision', null] }, null] }] }, 1, 0,
      ] } } } },
    ]) : [];
    const byId = new Map(counts.map((item) => [String(item._id), item]));
    return { screenings: rows.map((row) => ({ id: row._id.toString(), title: row.title ?? 'Sin título', area: row.area ?? '',
      status: row.status, revision: row.revision, createdAt: row.createdAt, updatedAt: row.updatedAt,
      configurationVersion: row.configurationVersion ?? 1, hasEditingDraft: !!row.editingDraft,
      invited: byId.get(row._id.toString())?.invited ?? 0, pendingReview: byId.get(row._id.toString())?.pendingReview ?? 0 })),
      total, page, pageSize, summary: { draft, published, closed, pendingReview } };
  }
  async detail(ownerId: string, id: string, version?: unknown) {
    const row = await this.owned(ownerId, id);
    if (row.status === 'draft') return this.view(row);
    const versions = row.configurationIds.length ? await this.models.ScreeningConfiguration.find({ _id: { $in: row.configurationIds }, ownerId, screeningId: id })
      .sort({ versionNumber: 1 }).select('versionNumber publishedAt').lean() : [{ versionNumber: 1, publishedAt: row.publishedAt }];
    if (version !== undefined && (typeof version !== 'string' || !/^[1-9]\d*$/.test(version))) invalid('Versión inválida.');
    const selected = version === undefined ? row.configurationVersion : Number(version);
    if (!versions.some((item) => item.versionNumber === selected)) throw new NotFoundException('Versión no encontrada.');
    const stored = version === undefined ? await configurationFor(this.models, row, 'active')
      : row.configurationIds.length ? await this.models.ScreeningConfiguration.findOne({ _id: { $in: row.configurationIds }, ownerId, screeningId: id, versionNumber: selected }) : row;
    if (!stored) throw new NotFoundException('Versión no encontrada.');
    return { id, ...this.configInput(stored), status: row.status, revision: row.revision, basedOnScreeningId: row.basedOnScreeningId,
      publishedAt: stored.publishedAt, closedAt: row.closedAt, configurationVersion: selected,
      activeVersion: row.configurationVersion, hasEditingDraft: !!row.editingDraft, versions };
  }
  private configInput(row: { title?: string | null; area?: string | null; description?: string | null; threshold?: number | null; questions: { toObject(): Record<string, unknown>; bankQuestionId?: Types.ObjectId | null }[] }) {
    return parseDraft({ title: row.title ?? undefined, area: row.area ?? undefined, description: row.description ?? undefined, threshold: row.threshold ?? undefined,
      questions: row.questions.map((q) => ({ ...q.toObject(), ...(q.bankQuestionId ? { bankQuestionId: q.bankQuestionId.toString() } : {}) })) });
  }
  async editing(ownerId: string, id: string) {
    const row = await this.owned(ownerId, id);
    if (row.status !== 'published' || !row.editingDraft) throw new ConflictException('No hay cambios en preparación.');
    const active = await configurationFor(this.models, row, 'active');
    return { id, ...this.configInput(row.editingDraft), status: 'draft', revision: row.revision,
      editingPublished: true, activeVersion: row.configurationVersion, configurationVersion: row.configurationVersion + 1,
      activeConfiguration: this.configInput(active) };
  }
  async beginEdit(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id);
    const input = object(body, ['expectedRevision']); const revision = expectedRevision(input.expectedRevision);
    if (row.status !== 'published') throw new ConflictException('Solo se pueden editar screenings publicados.');
    if (row.editingDraft) return this.editing(ownerId, id);
    if (row.revision !== revision) throw new ConflictException('El screening cambió. Recargá antes de editar.');
    const active = await configurationFor(this.models, row, 'active');
    const draft = this.configInput(active);
    const initial = !row.initialConfigurationId ? await this.models.ScreeningConfiguration.create({ ...draft, ownerId, screeningId: id,
      versionNumber: 1, publishedAt: row.publishedAt ?? new Date() }) : null;
    // Only a definite CAS loser is cleaned up. A thrown transport error has an unknown outcome.
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'published', revision, editingDraft: { $exists: false } },
      { $set: { editingDraft: draft, ...(initial ? { initialConfigurationId: initial._id, activeConfigurationId: initial._id } : {}) },
        ...(initial ? { $push: { configurationIds: initial._id } } : {}), $inc: { revision: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) {
      if (initial) await this.models.ScreeningConfiguration.deleteOne({ _id: initial._id });
      const current = await this.owned(ownerId, id);
      if (current.status === 'published' && current.editingDraft) return this.editing(ownerId, id);
      throw new ConflictException('El screening cambió. Recargá antes de editar.');
    }
    return this.editing(ownerId, id);
  }
  async saveEditing(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id); const draft = parseDraft(body, true);
    for (const q of draft.questions) if (q.bankQuestionId && !row.editingDraft?.questions.some((prior) => prior.id === q.id && prior.bankQuestionId?.toString() === q.bankQuestionId)) invalid('La referencia al banco no corresponde al borrador.');
    return this.replaceEditing(ownerId, id, draft.expectedRevision!, draft);
  }
  private async replaceEditing(ownerId: string, id: string, revision: number, draft: DraftInput) {
    const configuration = { title: draft.title, area: draft.area, description: draft.description, threshold: draft.threshold, questions: draft.questions };
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'published', revision, editingDraft: { $exists: true } },
      { $set: { editingDraft: configuration }, $inc: { revision: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ConflictException('Los cambios se modificaron o ya se publicaron. Tu edición local sigue disponible.');
    return this.editing(ownerId, id);
  }
  async publishEditing(ownerId: string, id: string, body: unknown) {
    const row = await this.owned(ownerId, id); const input = object(body, ['expectedRevision', 'confirmConfiguration']);
    const revision = expectedRevision(input.expectedRevision);
    if (row.status !== 'published' || !row.editingDraft || row.revision !== revision) throw new ConflictException('El borrador cambió. Recargá antes de publicar.');
    if (input.confirmConfiguration !== true) invalid('Confirmá que revisaste los cambios.');
    const draft = this.configInput(row.editingDraft); const issues = publicationIssues(draft);
    if (issues.length) throw new UnprocessableEntityException({ message: 'No se pueden publicar los cambios todavía.', issues });
    const configuration = await this.models.ScreeningConfiguration.create({ ...draft, ownerId, screeningId: id,
      versionNumber: row.configurationVersion + 1, publishedAt: new Date() });
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'published', revision, editingDraft: { $exists: true } },
      { $set: { activeConfigurationId: configuration._id, configurationVersion: configuration.versionNumber, title: draft.title, area: draft.area },
        $push: { configurationIds: configuration._id }, $unset: { editingDraft: 1 }, $inc: { revision: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) { await this.models.ScreeningConfiguration.deleteOne({ _id: configuration._id }); throw new ConflictException('El borrador cambió. Recargá antes de publicar.'); }
    return this.detail(ownerId, id);
  }
  async discardEditing(ownerId: string, id: string, body: unknown) {
    await this.owned(ownerId, id); const input = object(body, ['expectedRevision']); const revision = expectedRevision(input.expectedRevision);
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'published', revision, editingDraft: { $exists: true } },
      { $unset: { editingDraft: 1 }, $inc: { revision: 1 } }, { returnDocument: 'after' });
    if (!updated) throw new ConflictException('El borrador cambió. Recargá antes de descartarlo.');
    return this.detail(ownerId, id);
  }
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
    const row = await this.owned(ownerId, id);
    if (row.editingDraft) throw new ConflictException('Hay cambios en preparación. Publicalos o descartá ese borrador antes de cerrar el SC.');
    const input = object(body, ['expectedRevision', 'confirmClosure']);
    const revision = expectedRevision(input.expectedRevision);
    if (input.confirmClosure !== true) invalid('Confirmá el cierre del screening.');
    const closedAt = new Date();
    const updated = await this.models.Screening.findOneAndUpdate({ _id: id, ownerId, status: 'published', revision, editingDraft: { $exists: false } },
      { $set: { status: 'closed', closedAt }, $inc: { revision: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ConflictException('El screening cambió o ya está cerrado. Recargá antes de continuar.');
    return { id: updated._id.toString(), status: updated.status, revision: updated.revision, closedAt: updated.closedAt };
  }
  async copy(ownerId: string, id: string, body: unknown) {
    const root = await this.owned(ownerId, id); object(body ?? {}, []);
    if (!['published', 'closed'].includes(root.status)) throw new ConflictException('Solo se copian screenings publicados o cerrados.');
    const source = await configurationFor(this.models, root, 'active');
    const questions = source.questions.map((q) => {
      const ids = new Map(q.options.map((o) => [o.id, randomUUID()]));
      return { ...q.toObject(), id: randomUUID(), options: q.options.map((o) => ({ ...o.toObject(), id: ids.get(o.id)! })),
        ...(q.exclusion ? { exclusion: { acceptedOptionIds: q.exclusion.acceptedOptionIds?.map((id) => ids.get(id)!) ?? [] } } : {}) };
    });
    return this.view(await this.models.Screening.create({ ownerId, basedOnScreeningId: root._id,
      title: source.title ? `${source.title.slice(0, 112)} — copia` : 'Copia de screening',
      area: source.area, description: source.description, threshold: source.threshold, questions, status: 'draft', revision: 0 }));
  }
  async bank(area?: unknown) {
    if (area !== undefined && (typeof area !== 'string' || area.length > 120)) invalid('Área inválida.');
    const rows = await this.models.BankQuestion.find({ active: true, ...(area ? { area } : {}) }).sort({ area: 1, _id: 1 }).limit(100).lean();
    return { questions: rows.map(({ _id, active, createdAt, updatedAt, ...question }) => { void active; void createdAt; void updatedAt; return { id: _id.toString(), ...question }; }) };
  }
  async fromBank(ownerId: string, id: string, body: unknown, editing = false) {
    const root = await this.owned(ownerId, id);
    const row = editing ? root.editingDraft : root;
    const input = object(body, ['expectedRevision', 'bankQuestionId']);
    const revision = expectedRevision(input.expectedRevision);
    if (!row || root.revision !== revision || (editing ? root.status !== 'published' : root.status !== 'draft')) throw new ConflictException('El screening cambió o ya está publicado.');
    if (typeof input.bankQuestionId !== 'string' || !isObjectIdOrHexString(input.bankQuestionId)) throw new NotFoundException('Pregunta del banco no disponible.');
    const entry = await this.models.BankQuestion.findOne({ _id: input.bankQuestionId, active: true });
    if (!entry) throw new NotFoundException('Pregunta del banco no disponible.');
    if (row.questions.some((question) => question.bankQuestionId?.toString() === entry._id.toString())) {
      throw new ConflictException('Esta pregunta ya está incluida en el screening.');
    }
    const questions = row.questions.map((q) => { const value = q.toObject(); return { ...value, ...(q.bankQuestionId ? { bankQuestionId: q.bankQuestionId.toString() } : {}) } as DraftQuestion; });
    questions.push({ id: randomUUID(), bankQuestionId: entry._id.toString(), criterion: entry.criterion, text: entry.text,
      type: entry.type as DraftQuestion['type'], required: false, scored: false,
      options: entry.options.map((option) => ({ id: randomUUID(), label: option.label })), guidance: entry.guidance ?? undefined });
    const draft = parseDraft({ title: row.title, area: row.area, description: row.description, threshold: row.threshold, questions });
    return editing ? this.replaceEditing(ownerId, id, revision, draft) : this.replace(ownerId, id, revision, draft);
  }
}
