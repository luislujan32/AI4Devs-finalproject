import { Schema, type InferSchemaType } from 'mongoose';

const embedded = { _id: false, strict: 'throw' as const };
const stored = { timestamps: true, versionKey: false, strict: 'throw' } as const;
const integer = (min: number, max?: number) => ({
  type: Number, min, ...(max === undefined ? {} : { max }),
  validate: { validator: Number.isInteger, message: 'Debe ser entero.' },
});
const identifier = { type: String, required: true, minlength: 1 };
const email = { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ };
const questionTypes = ['boolean', 'single_choice', 'text'];
const uniqueIds = (items: { id: string }[]) => new Set(items.map((item) => item.id)).size === items.length;

const OptionSchema = new Schema({
  id: identifier, label: { type: String, required: true }, score: integer(0, 100),
}, embedded);
const BankOptionSchema = new Schema({ id: identifier, label: { type: String, required: true } }, embedded);
const ExclusionSchema = new Schema({
  acceptedOptionIds: { type: [String], castNonArrays: false, default: undefined,
    validate: (ids: string[]) => ids.every((id) => id.length > 0) && new Set(ids).size === ids.length },
}, embedded);

export const QuestionSchema = new Schema({
  id: identifier, bankQuestionId: Schema.Types.ObjectId,
  criterion: { type: String, maxlength: 120 }, text: { type: String, maxlength: 500 },
  type: { type: String, enum: questionTypes, required: true },
  required: { type: Boolean, default: false }, scored: { type: Boolean, default: false },
  weight: integer(1, 5),
  options: { type: [OptionSchema], castNonArrays: false, default: [],
    validate: [(options: { id: string }[]) => options.length <= 8, uniqueIds].map((validator) => ({ validator, message: 'Opciones inválidas.' })) },
  guidance: String, exclusion: { type: ExclusionSchema, default: undefined },
}, embedded);

export const AnswerSchema = new Schema({
  questionId: identifier, kind: { type: String, enum: ['option', 'text', 'unknown'], required: true },
  optionId: { type: String, minlength: 1 }, text: { type: String, maxlength: 2000 },
}, embedded);
AnswerSchema.pre('validate', function () {
  const valid = this.kind === 'option' ? !!this.optionId && this.text === undefined
    : this.kind === 'text' ? typeof this.text === 'string' && this.text.length > 0 && this.optionId === undefined
      : this.optionId === undefined && this.text === undefined;
  if (!valid) this.invalidate('kind', 'La forma de la respuesta no corresponde a su tipo.');
});

const EvidenceSchema = new Schema({
  status: { type: String, enum: ['known', 'unknown', 'missing'], required: true },
  source: { type: String, enum: ['candidate_declaration'], required: true },
  answerText: { type: String, default: null },
}, embedded);
const nullableInteger = (min: number, max: number) => ({
  ...integer(min, max), default: null,
  validate: { validator: (value: number | null) => value === null || Number.isInteger(value), message: 'Debe ser entero o null.' },
});
const CriterionSchema = new Schema({
  questionId: identifier, criterion: { type: String, required: true, maxlength: 120 },
  question: { type: String, required: true, maxlength: 500 }, evidence: { type: EvidenceSchema, required: true },
  optionScore: nullableInteger(0, 100), weight: nullableInteger(1, 5), weightedPoints: nullableInteger(0, 500),
  exclusionStatus: { type: String, enum: ['met', 'not_met', 'unknown', 'not_applicable'], required: true },
}, embedded);
const ReportSchema = new Schema({
  algorithmVersion: { type: String, enum: ['v1'], required: true },
  outcome: { type: String, enum: ['meets', 'not_meets', 'needs_review'], required: true },
  reason: { type: String, enum: ['knockout', 'score_below_threshold', 'incomplete', 'criteria_met'], required: true },
  score: { type: Number, min: 0, max: 100, default: null }, threshold: { ...integer(0, 100), required: true },
  incomplete: { type: Boolean, required: true }, criteria: { type: [CriterionSchema], castNonArrays: false, default: [],
    validate: (criteria: { questionId: string }[]) => criteria.length >= 1 && criteria.length <= 20
      && new Set(criteria.map((criterion) => criterion.questionId)).size === criteria.length },
  generatedAt: { type: Date, required: true },
}, embedded);
const ReviewSchema = new Schema({
  decision: { type: String, enum: ['continue', 'do_not_continue', 'clarify'], required: true },
  reason: { type: String, maxlength: 2000, default: '' },
  reviewerId: { type: Schema.Types.ObjectId, required: true }, reviewedAt: { type: Date, required: true },
  revision: { ...integer(1), required: true },
}, embedded);
const AuthSchema = new Schema({
  challengeId: String, codeHmac: { type: String, select: false }, expiresAt: Date,
  failedAttempts: { ...integer(0), default: 0 }, windowStartedAt: Date,
  requestsInWindow: { ...integer(0), default: 0 }, lastRequestedAt: Date,
}, embedded);

export const UserSchema = new Schema({
  email, passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true }, active: { type: Boolean, default: true },
}, { ...stored, collection: 'users' });
UserSchema.index({ email: 1 }, { unique: true });

export const ScreeningSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, minlength: 1, maxlength: 120 }, area: String,
  description: { type: String, maxlength: 6000 },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  revision: { ...integer(0), default: 0 }, threshold: integer(0, 100),
  questions: { type: [QuestionSchema], castNonArrays: false, default: [],
    validate: [(questions: { id: string }[]) => questions.length <= 20, uniqueIds].map((validator) => ({ validator, message: 'Preguntas inválidas.' })) },
  publishedAt: Date, closedAt: Date,
}, { ...stored, collection: 'screenings' });
ScreeningSchema.index({ ownerId: 1, createdAt: -1 });

export const BankQuestionSchema = new Schema({
  area: { type: String, required: true }, criterion: { type: String, required: true, maxlength: 120 },
  text: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: questionTypes, required: true },
  options: { type: [BankOptionSchema], castNonArrays: false, default: [],
    validate: [(options: { id: string }[]) => options.length <= 8, uniqueIds].map((validator) => ({ validator, message: 'Opciones inválidas.' })) },
  guidance: String, active: { type: Boolean, default: true },
}, { ...stored, collection: 'question_bank' });
BankQuestionSchema.index({ area: 1, active: 1 });

export const InvitationSchema = new Schema({
  screeningId: { type: Schema.Types.ObjectId, required: true }, ownerId: { type: Schema.Types.ObjectId, required: true },
  publicId: identifier, candidateEmail: email, candidateName: String,
  status: { type: String, enum: ['invited', 'in_progress', 'submitted'], default: 'invited' },
  expiresAt: { type: Date, required: true }, purgeAt: { type: Date, required: true },
  answerRevision: { ...integer(0), default: 0 },
  answers: { type: [AnswerSchema], castNonArrays: false, default: [],
    validate: (answers: { questionId: string }[]) => new Set(answers.map((answer) => answer.questionId)).size === answers.length },
  submittedAt: Date, report: { type: ReportSchema, default: undefined }, review: { type: ReviewSchema, default: undefined },
  auth: { type: AuthSchema, default: undefined },
}, { ...stored, collection: 'invitations' });
InvitationSchema.index({ publicId: 1 }, { unique: true });
InvitationSchema.index({ screeningId: 1, candidateEmail: 1 }, { unique: true });
InvitationSchema.index({ ownerId: 1, createdAt: -1 });
InvitationSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export const SessionSchema = new Schema({
  sessionId: { ...identifier, select: false },
  principal: { type: String, enum: ['recruiter', 'candidate'], required: true },
  userId: Schema.Types.ObjectId, invitationId: Schema.Types.ObjectId,
  csrfToken: { type: String, required: true, select: false }, expiresAt: { type: Date, required: true },
}, { ...stored, collection: 'sessions' });
SessionSchema.pre('validate', function () {
  if (this.principal === 'recruiter' ? !this.userId || this.invitationId !== undefined : !this.invitationId || this.userId !== undefined) {
    this.invalidate('principal', 'Una sesión debe corresponder a un solo principal.');
  }
});
SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type Question = InferSchemaType<typeof QuestionSchema>;
export type User = InferSchemaType<typeof UserSchema>;
export type Screening = InferSchemaType<typeof ScreeningSchema>;
export type BankQuestion = InferSchemaType<typeof BankQuestionSchema>;
export type Invitation = InferSchemaType<typeof InvitationSchema>;
export type Session = InferSchemaType<typeof SessionSchema>;

export const domainDefinitions = [
  { name: 'User', schema: UserSchema }, { name: 'Screening', schema: ScreeningSchema },
  { name: 'BankQuestion', schema: BankQuestionSchema }, { name: 'Invitation', schema: InvitationSchema },
  { name: 'Session', schema: SessionSchema },
];
