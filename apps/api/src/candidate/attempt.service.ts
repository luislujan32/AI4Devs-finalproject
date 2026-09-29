import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type { CandidateContext } from '../auth/auth.service.js';
import { domainModels } from '../persistence/models.js';
import { expectedRevision, object } from '../screenings/validation.js';
import { evaluate, type EvaluationAnswer, type EvaluationQuestion } from './evaluation.js';

function answersInput(value: unknown, questions: EvaluationQuestion[]): EvaluationAnswer[] {
  if (!Array.isArray(value) || value.length > questions.length) throw new UnprocessableEntityException('Respuestas inválidas.');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set<string>();
  return value.map((item) => {
    const row = object(item, ['questionId', 'kind', 'optionId', 'text']);
    const question = typeof row.questionId === 'string' ? byId.get(row.questionId) : undefined;
    if (!question || seen.has(question.id)) throw new UnprocessableEntityException('Pregunta desconocida o duplicada.');
    seen.add(question.id);
    if (row.kind === 'option' && question.type !== 'text' && typeof row.optionId === 'string'
      && question.options.some((option) => option.id === row.optionId) && row.text === undefined) {
      return { questionId: question.id, kind: 'option', optionId: row.optionId };
    }
    if (row.kind === 'unknown' && question.type !== 'text' && row.optionId === undefined && row.text === undefined) {
      return { questionId: question.id, kind: 'unknown' };
    }
    if (row.kind === 'text' && question.type === 'text' && typeof row.text === 'string'
      && !!row.text.trim() && row.text.length <= 2000 && row.optionId === undefined) {
      return { questionId: question.id, kind: 'text', text: row.text };
    }
    throw new UnprocessableEntityException('La respuesta no corresponde a la pregunta.');
  });
}

@Injectable()
export class AttemptService {
  private readonly models;
  constructor(@InjectConnection() connection: Connection) { this.models = domainModels(connection); }
  private async scoped(context: CandidateContext) {
    const now = new Date();
    const invitation = await this.models.Invitation.findOne({ _id: context.invitationId,
      expiresAt: { $gt: now }, purgeAt: { $gt: now } });
    if (!invitation) throw new NotFoundException('Invitación no disponible.');
    const screening = await this.models.Screening.findOne({ _id: invitation.screeningId, ownerId: invitation.ownerId, status: 'published' });
    if (!screening) throw new NotFoundException('Screening no disponible.');
    const questions: EvaluationQuestion[] = screening.questions.map((question) => ({
      id: question.id, criterion: question.criterion ?? '', text: question.text ?? '', type: question.type as EvaluationQuestion['type'],
      scored: question.scored, weight: question.weight ?? undefined, options: question.options.map((option) => ({
        id: option.id, label: option.label, score: option.score ?? undefined })),
      ...(question.exclusion ? { exclusion: { acceptedOptionIds: question.exclusion.acceptedOptionIds ?? [] } } : {}),
    }));
    return { invitation, screening, questions };
  }
  async read(context: CandidateContext) {
    const { invitation, screening } = await this.scoped(context);
    return { title: screening.title, description: screening.description ?? '', status: invitation.status,
      answerRevision: invitation.answerRevision, submittedAt: invitation.submittedAt ?? null,
      questions: screening.questions.map((question) => ({ id: question.id, text: question.text, type: question.type,
        required: question.required, options: question.options.map((option) => ({ id: option.id, label: option.label })),
      })),
      answers: invitation.answers.map((answer) => ({ questionId: answer.questionId, kind: answer.kind,
        ...(answer.optionId ? { optionId: answer.optionId } : {}), ...(answer.text ? { text: answer.text } : {}) })) };
  }
  async save(context: CandidateContext, input: unknown) {
    const body = object(input, ['expectedRevision', 'answers']);
    const revision = expectedRevision(body.expectedRevision);
    const { invitation, questions } = await this.scoped(context);
    const answers = answersInput(body.answers, questions);
    if (invitation.status === 'submitted' || invitation.answerRevision !== revision) {
      throw new ConflictException('El intento ya fue enviado o cambió. Recargá antes de continuar.');
    }
    const now = new Date();
    const updated = await this.models.Invitation.findOneAndUpdate({ _id: invitation._id, status: { $in: ['invited', 'in_progress'] },
      answerRevision: revision, expiresAt: { $gt: now }, purgeAt: { $gt: now } },
    { $set: { answers, status: 'in_progress' }, $inc: { answerRevision: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ConflictException('El intento cambió. Recargá antes de continuar.');
    return { status: updated.status, answerRevision: updated.answerRevision, answers: updated.answers.map((answer) => ({
      questionId: answer.questionId, kind: answer.kind, ...(answer.optionId ? { optionId: answer.optionId } : {}),
      ...(answer.text ? { text: answer.text } : {}) })) };
  }
  async submit(context: CandidateContext, input: unknown) {
    const body = object(input, ['expectedRevision']);
    const revision = expectedRevision(body.expectedRevision);
    const { invitation, screening, questions } = await this.scoped(context);
    if (invitation.status === 'submitted' && invitation.submittedAt) return { status: 'submitted', submittedAt: invitation.submittedAt };
    if (invitation.answerRevision !== revision) throw new ConflictException('Las respuestas cambiaron. Recargá antes de enviar.');
    const answers = answersInput(invitation.answers.map((answer) => answer.toObject()), questions);
    const answered = new Set(answers.map((answer) => answer.questionId));
    const missing = screening.questions.filter((question) => question.required && !answered.has(question.id));
    if (missing.length) throw new UnprocessableEntityException({ message: 'Completá las preguntas obligatorias antes de enviar.',
      issues: missing.map((question) => question.id) });
    const submittedAt = new Date();
    const report = evaluate(questions, answers, screening.threshold!, submittedAt);
    const updated = await this.models.Invitation.findOneAndUpdate({ _id: invitation._id, status: { $in: ['invited', 'in_progress'] },
      answerRevision: revision, expiresAt: { $gt: submittedAt }, purgeAt: { $gt: submittedAt } },
    { $set: { status: 'submitted', submittedAt, report } }, { returnDocument: 'after', runValidators: true });
    if (updated?.submittedAt) return { status: 'submitted', submittedAt: updated.submittedAt };
    const winner = await this.models.Invitation.findOne({ _id: invitation._id, status: 'submitted',
      expiresAt: { $gt: new Date() }, purgeAt: { $gt: new Date() } }).select('submittedAt');
    if (winner?.submittedAt) return { status: 'submitted', submittedAt: winner.submittedAt };
    throw new ConflictException('El intento cambió. Recargá antes de enviar.');
  }
}
