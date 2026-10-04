import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { randomBytes } from 'node:crypto';
import type { Connection, Types } from 'mongoose';
import { domainModels } from './models.js';
import type { Question } from './schemas.js';
import { ConflictException } from '@nestjs/common';

type Id = string | Types.ObjectId;

@Injectable()
export class PersistenceRepository implements OnModuleInit {
  private readonly models;
  constructor(@InjectConnection() connection: Connection) {
    this.models = domainModels(connection);
  }

  async onModuleInit() {
    await Promise.all(Object.values(this.models).map((model) => model.init()));
  }

  findOwnedScreening(ownerId: Id, screeningId: Id) {
    return this.models.Screening.findOne({ _id: screeningId, ownerId }).exec();
  }

  async createInvitation(ownerId: Id, screeningId: Id, input: {
    candidateEmail: string; candidateName?: string; expiresAt: Date; purgeAt: Date; emailTokenHash: string;
  }) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const screening = await this.models.Screening.findOne({ _id: screeningId, ownerId, status: 'published' }).select('activeConfigurationId configurationVersion');
      if (!screening) return null;
      const row = await this.models.Invitation.create({
        screeningId, ownerId, configurationId: screening.activeConfigurationId, configurationVersion: screening.configurationVersion,
        candidateEmail: input.candidateEmail, candidateName: input.candidateName,
        expiresAt: input.expiresAt, purgeAt: input.purgeAt, publicId: randomBytes(32).toString('base64url'),
        emailAccess: { tokenHash: input.emailTokenHash, expiresAt: input.expiresAt },
      });
      let current;
      try { current = await this.models.Screening.exists({ _id: screeningId, ownerId, status: 'published',
        activeConfigurationId: screening.activeConfigurationId ?? { $exists: false } }); }
      catch (error) {
        await this.models.Invitation.deleteOne({ _id: row._id, status: 'invited', answerRevision: 0 });
        throw error;
      }
      if (current) return row;
      const deleted = await this.models.Invitation.deleteOne({ _id: row._id, status: 'invited', answerRevision: 0 });
      if (!deleted.deletedCount) throw new ConflictException('La invitación cambió mientras se preparaba. Recargá antes de continuar.');
    }
    throw new ConflictException('La configuración cambió mientras se preparaba la invitación. Intentá nuevamente.');
  }

  async saveDraftQuestions(ownerId: Id, screeningId: Id, expectedRevision: number, questions: Question[]) {
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0) throw new Error('Revisión inválida.');
    const filter = { _id: screeningId, ownerId, status: 'draft' as const, revision: expectedRevision };
    const draft = await this.models.Screening.findOne(filter);
    if (!draft) return null;
    draft.set({ questions, revision: expectedRevision + 1 });
    // Full document validation also covers arrays and nested cross-field rules.
    await draft.validate();
    return this.models.Screening.findOneAndUpdate(filter, {
      $set: { questions: draft.toObject().questions, revision: expectedRevision + 1 },
    }, { returnDocument: 'after', runValidators: true }).exec();
  }
}
