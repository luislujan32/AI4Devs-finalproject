import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { AuthService } from './auth.service.js';
import { RecruiterGuard } from './recruiter.guard.js';
import { AuthController } from './auth.controller.js';

@Module({ imports: [PersistenceModule], providers: [AuthService, RecruiterGuard],
  controllers: [AuthController], exports: [AuthService, RecruiterGuard] })
export class AuthModule {}
