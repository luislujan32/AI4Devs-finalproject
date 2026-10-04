import { ConflictException, HttpException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { randomBytes, randomInt } from 'node:crypto';
import type { Request, Response } from 'express';
import { isObjectIdOrHexString, type Connection } from 'mongoose';
import { AuthService } from '../auth/auth.service.js';
import { domainModels } from '../persistence/models.js';
import { PersistenceRepository } from '../persistence/persistence.repository.js';
import { enumQuery, pageQuery, searchQuery } from '../persistence/list-query.js';
import { sendLocalCode, sendLocalInvitation } from './local-mail.js';
import { configurationFor } from '../screenings/configuration.js';

const DAY = 86400000;
const HOUR = 3600000;
const publicIdPattern = /^[\w-]{43}$/;
function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key))) {
    throw new UnprocessableEntityException('Datos inválidos.');
  }
  return value as Record<string, unknown>;
}

@Injectable()
export class CandidateService {
  private readonly models;
  constructor(@InjectConnection() connection: Connection, private readonly auth: AuthService, private readonly repository: PersistenceRepository) {
    this.models = domainModels(connection);
  }
  private invitationView(row: { _id: { toString(): string }; publicId: string; candidateEmail: string; candidateName?: string | null;
    status: string; expiresAt: Date; createdAt?: Date; submittedAt?: Date | null; configurationVersion?: number;
    report?: { outcome: string; score?: number | null; threshold: number } | null;
    review?: { decision: string; reviewedAt: Date } | null }) {
    return { id: row._id.toString(), publicId: row.publicId, candidateEmail: row.candidateEmail,
      candidateName: row.candidateName ?? null, status: row.status, expiresAt: row.expiresAt, createdAt: row.createdAt,
      configurationVersion: row.configurationVersion ?? 1,
      submittedAt: row.submittedAt ?? null,
      result: row.report ? { outcome: row.report.outcome, score: row.report.score ?? null, threshold: row.report.threshold } : null,
      review: row.review ? { decision: row.review.decision, reviewedAt: row.review.reviewedAt } : null };
  }
  async list(ownerId: string, screeningId: string, query: Record<string, unknown> = {}) {
    if (!isObjectIdOrHexString(screeningId) || !await this.models.Screening.exists({ _id: screeningId, ownerId })) throw new NotFoundException('Screening no encontrado.');
    const { page, pageSize } = pageQuery(query);
    const status = enumQuery(query.status, ['invited', 'in_progress', 'submitted'], 'respuesta');
    const result = enumQuery(query.result, ['meets', 'not_meets', 'needs_review'], 'resultado');
    const decision = enumQuery(query.decision, ['continue', 'do_not_continue', 'clarify', 'pending'], 'decisión');
    const queue = enumQuery(query.queue, ['review'], 'cola');
    const search = searchQuery(query.search);
    if (queue && ((status && status !== 'submitted') || (decision && decision !== 'pending'))) {
      throw new UnprocessableEntityException('La cola Por revisar requiere respuestas recibidas sin decisión.');
    }
    if (decision === 'pending' && status && status !== 'submitted') throw new UnprocessableEntityException('La decisión pendiente requiere respuestas recibidas.');
    const now = new Date();
    const scope = { screeningId, ownerId, purgeAt: { $gt: now } };
    const filter = { ...scope, ...(status ? { status } : {}),
      ...(queue ? { status: 'submitted' as const, 'review.decision': { $exists: false } } : {}), ...(result ? { 'report.outcome': result } : {}),
      ...(decision ? { 'review.decision': decision === 'pending' ? { $exists: false } : decision } : {}),
      ...(decision === 'pending' ? { status: 'submitted' as const } : {}),
      ...(search ? { $or: [{ candidateName: search }, { candidateEmail: search }] } : {}) };
    const [rows, total, invited, pendingReview] = await Promise.all([
      this.models.Invitation.find(filter)
      .select('publicId candidateEmail candidateName status expiresAt createdAt submittedAt configurationVersion report.outcome report.score report.threshold review.decision review.reviewedAt')
      .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      this.models.Invitation.countDocuments(filter),
      this.models.Invitation.countDocuments(scope),
      this.models.Invitation.countDocuments({ ...scope, status: 'submitted', 'review.decision': { $exists: false } }),
    ]);
    return { invitations: rows.map((row) => this.invitationView(row)), total, page, pageSize, summary: { invited, pendingReview } };
  }
  async create(ownerId: string, screeningId: string, input: unknown, origin: string) {
    if (!isObjectIdOrHexString(screeningId)) throw new NotFoundException('Screening no encontrado.');
    if (!origin || new URL(origin).origin !== origin) throw new UnprocessableEntityException('Origen inválido.');
    const body = record(input, ['candidateEmail', 'candidateName']);
    const candidateEmail = typeof body.candidateEmail === 'string' ? body.candidateEmail.trim().toLowerCase() : '';
    if (candidateEmail.length > 254 || !/^[^\s@]+@(?:[^\s@.]+\.)*example\.test$/.test(candidateEmail)) {
      throw new UnprocessableEntityException('Usá un correo ficticio terminado en example.test.');
    }
    const candidateName = body.candidateName === undefined ? undefined : typeof body.candidateName === 'string' ? body.candidateName.trim() : null;
    if (candidateName === null || (candidateName && candidateName.length > 120)) throw new UnprocessableEntityException('Nombre inválido.');
    const now = Date.now();
    try {
      const emailToken = randomBytes(32).toString('base64url');
      const row = await this.repository.createInvitation(ownerId, screeningId, {
        candidateEmail, ...(candidateName ? { candidateName } : {}), expiresAt: new Date(now + 7 * DAY), purgeAt: new Date(now + 90 * DAY),
        emailTokenHash: this.auth.digest(`candidate-email-link:${emailToken}`),
      });
      if (!row) throw new NotFoundException('Screening publicado no encontrado.');
      try {
        const screening = await this.models.Screening.findOne({ _id: screeningId, ownerId, status: 'published' });
        if (!screening) throw new ConflictException('El screening se cerró mientras se preparaba la invitación.');
        const configuration = await configurationFor(this.models, screening, 'initial', row.configurationId);
        try { await sendLocalInvitation(candidateEmail, candidateName, configuration.title ?? 'Screening', `${origin}/#invite=${row.publicId}&access=${emailToken}`, row.expiresAt); }
        catch { throw new ServiceUnavailableException('No pudimos enviar la invitación. Intentá nuevamente.'); }
        return { ...this.invitationView(row), emailSent: true };
      } catch (error) {
        await this.models.Invitation.deleteOne({ _id: row._id, status: 'invited', answerRevision: 0 });
        throw error;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) throw new ConflictException('Ya existe una invitación para ese correo.');
      throw error;
    }
  }
  private active(publicId: unknown) {
    if (typeof publicId !== 'string' || !publicIdPattern.test(publicId)) throw new NotFoundException('Invitación no disponible.');
    return this.models.Invitation.findOne({ publicId, expiresAt: { $gt: new Date() }, purgeAt: { $gt: new Date() } });
  }
  async emailLink(req: Request, res: Response, input: unknown) {
    this.auth.checkLoginCsrf(req);
    const body = record(input, ['publicId', 'token']);
    if (typeof body.publicId !== 'string' || !publicIdPattern.test(body.publicId)
      || typeof body.token !== 'string' || !publicIdPattern.test(body.token)) throw new UnprocessableEntityException('Enlace inválido.');
    await this.auth.consumeLimit('candidate-email-link-ip', req.socket.remoteAddress ?? 'unknown', 50);
    const now = new Date();
    const row = await this.models.Invitation.findOneAndUpdate({ publicId: body.publicId,
      'emailAccess.tokenHash': this.auth.digest(`candidate-email-link:${body.token}`),
      'emailAccess.expiresAt': { $gt: now }, 'emailAccess.usedAt': { $exists: false },
      expiresAt: { $gt: now }, purgeAt: { $gt: now } },
    { $set: { 'emailAccess.usedAt': now }, $unset: { 'emailAccess.tokenHash': 1 } }, { returnDocument: 'after' });
    if (!row) throw new UnauthorizedException('El enlace de acceso ya se usó o venció. Verificá tu correo con un código.');
    const session = await this.auth.startCandidateSession(req, res, row._id.toString(), row.expiresAt);
    return { status: 'authenticated', publicId: row.publicId, ...session };
  }
  async requestCode(req: Request, input: unknown) {
    this.auth.checkLoginCsrf(req);
    const body = record(input, ['publicId']);
    await this.auth.consumeLimit('candidate-code-ip', req.socket.remoteAddress ?? 'unknown', 20);
    const row = await this.active(body.publicId);
    if (!row) throw new NotFoundException('Invitación vencida o no disponible.');
    const now = new Date(); const hourAgo = new Date(now.getTime() - HOUR);
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const challengeId = randomBytes(16).toString('base64url');
    const codeHmac = this.auth.digest(`candidate-code:${row._id}:${challengeId}:${code}`);
    const common = { _id: row._id, expiresAt: { $gt: now }, purgeAt: { $gt: now },
      $or: [{ 'auth.lastRequestedAt': { $exists: false } }, { 'auth.lastRequestedAt': { $lte: new Date(now.getTime() - 60000) } }] };
    const challenge = { 'auth.challengeId': challengeId, 'auth.codeHmac': codeHmac,
      'auth.expiresAt': new Date(now.getTime() + 600000), 'auth.failedAttempts': 0, 'auth.lastRequestedAt': now };
    let updated = await this.models.Invitation.findOneAndUpdate({ ...common,
      $and: [{ 'auth.windowStartedAt': { $gt: hourAgo } }, { 'auth.requestsInWindow': { $lt: 5 } }] },
      { $set: challenge, $inc: { 'auth.requestsInWindow': 1 } }, { returnDocument: 'after' });
    if (!updated) updated = await this.models.Invitation.findOneAndUpdate({ ...common,
      $and: [{ $or: [{ 'auth.windowStartedAt': { $exists: false } }, { 'auth.windowStartedAt': { $lte: hourAgo } }] }] },
      { $set: { ...challenge, 'auth.windowStartedAt': now, 'auth.requestsInWindow': 1 } }, { returnDocument: 'after' });
    if (!updated) throw new HttpException('Esperá antes de pedir otro código.', 429);
    try { await sendLocalCode(updated.candidateEmail, code); }
    catch { throw new ServiceUnavailableException('No pudimos entregar el código. Intentá nuevamente en un minuto.'); }
    return { status: 'sent', retryAfterSeconds: 60 };
  }
  async verify(req: Request, res: Response, input: unknown) {
    this.auth.checkLoginCsrf(req);
    const body = record(input, ['publicId', 'code']);
    if (typeof body.publicId !== 'string' || !publicIdPattern.test(body.publicId)
      || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) throw new UnprocessableEntityException('Código inválido.');
    await this.auth.consumeLimit('candidate-verify-ip', req.socket.remoteAddress ?? 'unknown', 100);
    const row = await this.active(body.publicId);
    if (!row?.auth?.challengeId || !row.auth.expiresAt || row.auth.expiresAt <= new Date() || row.auth.failedAttempts >= 5) {
      throw new UnauthorizedException('El código venció o es incorrecto. Solicitá uno nuevo.');
    }
    const codeHmac = this.auth.digest(`candidate-code:${row._id}:${row.auth.challengeId}:${body.code}`);
    const now = new Date();
    const common = { _id: row._id, 'auth.challengeId': row.auth.challengeId,
      'auth.expiresAt': { $gt: now }, 'auth.failedAttempts': { $lt: 5 }, expiresAt: { $gt: now }, purgeAt: { $gt: now } };
    const consumed = await this.models.Invitation.findOneAndUpdate({ ...common, 'auth.codeHmac': codeHmac },
      { $unset: { 'auth.challengeId': 1, 'auth.codeHmac': 1, 'auth.expiresAt': 1 }, $set: { status: row.status === 'submitted' ? 'submitted' : 'in_progress' } },
      { returnDocument: 'after' });
    if (!consumed) {
      await this.models.Invitation.updateOne(common, { $inc: { 'auth.failedAttempts': 1 } });
      throw new UnauthorizedException('El código venció o es incorrecto. Solicitá uno nuevo.');
    }
    const session = await this.auth.startCandidateSession(req, res, row._id.toString(), row.expiresAt);
    return { status: 'authenticated', publicId: row.publicId, ...session };
  }
  async summary(invitationId: string) {
    const row = await this.models.Invitation.findById(invitationId).select('status candidateName expiresAt');
    if (!row) throw new UnauthorizedException('Sesión no disponible.');
    return { status: row.status, candidateName: row.candidateName ?? null, expiresAt: row.expiresAt };
  }
}
