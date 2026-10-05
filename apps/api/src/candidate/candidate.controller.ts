import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RecruiterGuard, type RecruiterRequest } from '../auth/recruiter.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { CandidateGuard, type CandidateRequest } from './candidate.guard.js';
import { CandidateService } from './candidate.service.js';

@Controller('screenings/:id/invitations') @UseGuards(RecruiterGuard)
export class InvitationController {
  constructor(private readonly candidates: CandidateService) {}
  @Get() @Header('Cache-Control', 'no-store')
  list(@Req() req: RecruiterRequest, @Param('id') id: string, @Query() query: Record<string, unknown>) { return this.candidates.list(req.auth.user.id, id, query); }
  @Post()
  create(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.candidates.create(req.auth.user.id, id, body, req.headers.origin ?? ''); }
}

@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidates: CandidateService, private readonly auth: AuthService) {}
  @Post('access/request') @HttpCode(200)
  requestCode(@Req() req: Request, @Body() body: unknown) { return this.candidates.requestCode(req, body); }
  @Post('access/verify') @HttpCode(200)
  verify(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: unknown) { return this.candidates.verify(req, res, body); }
  @Post('access/email-link') @HttpCode(200) @Header('Cache-Control', 'no-store')
  emailLink(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: unknown) { return this.candidates.emailLink(req, res, body); }
  @Get('session') @UseGuards(CandidateGuard) @Header('Cache-Control', 'no-store')
  async session(@Req() req: CandidateRequest) {
    return { csrfToken: req.candidate.csrfToken, expiresAt: req.candidate.expiresAt,
      publicId: req.candidate.publicId, invitation: await this.candidates.summary(req.candidate.invitationId) };
  }
  @Post('logout') @UseGuards(CandidateGuard) @HttpCode(200)
  logout(@Req() req: CandidateRequest, @Res({ passthrough: true }) res: Response) { return this.auth.logout(req, res, req.candidate, 'candidate'); }
}
