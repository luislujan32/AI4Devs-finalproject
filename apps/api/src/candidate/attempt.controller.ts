import { Body, Controller, Get, Header, HttpCode, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CandidateGuard, type CandidateRequest } from './candidate.guard.js';
import { AttemptService } from './attempt.service.js';

@Controller('candidate/attempt') @UseGuards(CandidateGuard)
export class AttemptController {
  constructor(private readonly attempts: AttemptService) {}
  @Get() @Header('Cache-Control', 'no-store')
  read(@Req() req: CandidateRequest) { return this.attempts.read(req.candidate); }
  @Put('answers') @HttpCode(200)
  save(@Req() req: CandidateRequest, @Body() body: unknown) { return this.attempts.save(req.candidate, body); }
  @Post('submit') @HttpCode(200)
  submit(@Req() req: CandidateRequest, @Body() body: unknown) { return this.attempts.submit(req.candidate, body); }
}
