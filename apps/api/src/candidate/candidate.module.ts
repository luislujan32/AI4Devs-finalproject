import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { CandidateController, InvitationController } from './candidate.controller.js';
import { CandidateGuard } from './candidate.guard.js';
import { CandidateService } from './candidate.service.js';

@Module({ imports: [AuthModule, PersistenceModule], providers: [CandidateService, CandidateGuard],
  controllers: [CandidateController, InvitationController] })
export class CandidateModule {}
