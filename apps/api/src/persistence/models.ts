import type { Connection } from 'mongoose';
import { UserSchema, ScreeningSchema, BankQuestionSchema, InvitationSchema, SessionSchema } from './schemas.js';

export function domainModels(connection: Connection) {
  return {
    User: connection.model('User', UserSchema), Screening: connection.model('Screening', ScreeningSchema),
    BankQuestion: connection.model('BankQuestion', BankQuestionSchema),
    Invitation: connection.model('Invitation', InvitationSchema), Session: connection.model('Session', SessionSchema),
  };
}
