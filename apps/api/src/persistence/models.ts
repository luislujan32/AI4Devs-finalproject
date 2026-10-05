import type { Connection } from 'mongoose';
import { UserSchema, ScreeningSchema, ScreeningConfigurationSchema, BankQuestionSchema, InvitationSchema, SessionSchema } from './schemas.js';

export function domainModels(connection: Connection) {
  return {
    User: connection.model('User', UserSchema), Screening: connection.model('Screening', ScreeningSchema),
    ScreeningConfiguration: connection.model('ScreeningConfiguration', ScreeningConfigurationSchema),
    BankQuestion: connection.model('BankQuestion', BankQuestionSchema),
    Invitation: connection.model('Invitation', InvitationSchema), Session: connection.model('Session', SessionSchema),
  };
}
