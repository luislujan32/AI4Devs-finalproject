import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type CandidateContext } from '../auth/auth.service.js';

export type CandidateRequest = Request & { candidate: CandidateContext };
@Injectable()
export class CandidateGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<CandidateRequest>();
    req.candidate = await this.auth.candidateContext(req);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) this.auth.checkMutation(req, req.candidate);
    return true;
  }
}
