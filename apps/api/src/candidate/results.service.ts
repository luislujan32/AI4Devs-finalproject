import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { isObjectIdOrHexString, type Connection } from 'mongoose';
import { domainModels } from '../persistence/models.js';
import { expectedRevision, invalid, object } from '../screenings/validation.js';

@Injectable()
export class ResultsService {
  private readonly models;
  constructor(@InjectConnection() connection: Connection) { this.models = domainModels(connection); }

  private async owned(ownerId: string, invitationId: string) {
    if (!isObjectIdOrHexString(invitationId)) throw new NotFoundException('Invitación no encontrada.');
    const row = await this.models.Invitation.findOne({ _id: invitationId, ownerId, purgeAt: { $gt: new Date() } });
    if (!row) throw new NotFoundException('Invitación no encontrada.');
    return row;
  }

  async report(ownerId: string, invitationId: string) {
    const row = await this.owned(ownerId, invitationId);
    if (row.status !== 'submitted' || !row.report) throw new ConflictException('Todavía no hay respuestas enviadas.');
    return { invitationId: row._id.toString(), screeningId: row.screeningId.toString(),
      report: row.report, review: row.review ?? null };
  }

  async review(ownerId: string, invitationId: string, input: unknown) {
    const body = object(input, ['expectedRevision', 'decision', 'reason']);
    const revision = expectedRevision(body.expectedRevision);
    if (typeof body.decision !== 'string' || !['continue', 'do_not_continue'].includes(body.decision)) invalid('Elegí una decisión válida.');
    if (body.reason !== undefined && (typeof body.reason !== 'string' || body.reason.length > 2000)) invalid('Motivo inválido.');
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const row = await this.owned(ownerId, invitationId);
    if (row.status !== 'submitted' || !row.report) throw new ConflictException('Todavía no hay respuestas enviadas.');
    if (body.decision === 'continue' && row.report.outcome !== 'meets' && !reason) {
      invalid('Explicá por qué continuás con una postulación que no cumple o requiere revisión.');
    }
    if ((row.review?.revision ?? 0) !== revision) throw new ConflictException('La revisión cambió. Recargá antes de guardar.');
    const review = { decision: body.decision as 'continue' | 'do_not_continue', reason,
      reviewerId: ownerId, reviewedAt: new Date(), revision: revision + 1 };
    const updated = await this.models.Invitation.findOneAndUpdate({ _id: invitationId, ownerId, status: 'submitted',
      purgeAt: { $gt: new Date() }, ...(revision ? { 'review.revision': revision } : { 'review.revision': { $exists: false } }) },
    { $set: { review } }, { returnDocument: 'after', runValidators: true });
    if (!updated?.review) throw new ConflictException('La revisión cambió. Recargá antes de guardar.');
    return { review: updated.review };
  }
}
