import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { CandidateController, InvitationController } from './candidate.controller.js';
import { CandidateGuard } from './candidate.guard.js';
import { CandidateService } from './candidate.service.js';
import { AttemptController } from './attempt.controller.js';
import { AttemptService } from './attempt.service.js';
import { ResultsController } from './results.controller.js';
import { ResultsService } from './results.service.js';

@Module({ imports: [AuthModule, PersistenceModule], providers: [CandidateService, CandidateGuard, AttemptService, ResultsService],
  controllers: [CandidateController, InvitationController, AttemptController, ResultsController] })
export class CandidateModule {}
