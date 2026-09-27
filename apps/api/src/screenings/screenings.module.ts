import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { ScreeningsService } from './screenings.service.js';
import { QuestionBankController, ScreeningsController } from './screenings.controller.js';

@Module({ imports: [AuthModule, PersistenceModule], providers: [ScreeningsService], controllers: [ScreeningsController, QuestionBankController] })
export class ScreeningsModule {}
