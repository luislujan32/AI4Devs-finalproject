import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type AuthContext } from './auth.service.js';

export type RecruiterRequest = Request & { auth: AuthContext };
@Injectable()
export class RecruiterGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<RecruiterRequest>();
    req.auth = await this.auth.context(req);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) this.auth.checkMutation(req, req.auth);
    return true;
  }
}
