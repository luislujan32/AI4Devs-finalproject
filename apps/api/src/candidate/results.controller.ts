import { Body, Controller, Get, Header, Param, Put, Req, UseGuards } from '@nestjs/common';
import { RecruiterGuard, type RecruiterRequest } from '../auth/recruiter.guard.js';
import { ResultsService } from './results.service.js';

@Controller('invitations/:invitationId') @UseGuards(RecruiterGuard)
export class ResultsController {
  constructor(private readonly results: ResultsService) {}
  @Get('report') @Header('Cache-Control', 'no-store')
  report(@Req() req: RecruiterRequest, @Param('invitationId') id: string) { return this.results.report(req.auth.user.id, id); }
  @Put('review') @Header('Cache-Control', 'no-store')
  review(@Req() req: RecruiterRequest, @Param('invitationId') id: string, @Body() body: unknown) {
    return this.results.review(req.auth.user.id, id, body);
  }
}
