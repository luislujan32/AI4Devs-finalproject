import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { RecruiterGuard, type RecruiterRequest } from '../auth/recruiter.guard.js';
import { ScreeningsService } from './screenings.service.js';

@Controller('screenings') @UseGuards(RecruiterGuard)
export class ScreeningsController {
  constructor(private readonly screenings: ScreeningsService) {}
  @Get() @Header('Cache-Control', 'no-store')
  list(@Req() req: RecruiterRequest, @Query() query: Record<string, unknown>) { return this.screenings.list(req.auth.user.id, query); }
  @Get(':id') @Header('Cache-Control', 'no-store')
  detail(@Req() req: RecruiterRequest, @Param('id') id: string, @Query('version') version?: unknown) { return this.screenings.detail(req.auth.user.id, id, version); }
  @Get(':id/edit') @Header('Cache-Control', 'no-store')
  editing(@Req() req: RecruiterRequest, @Param('id') id: string) { return this.screenings.editing(req.auth.user.id, id); }
  @Post(':id/edit')
  beginEdit(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.beginEdit(req.auth.user.id, id, body); }
  @Put(':id/edit')
  saveEditing(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.saveEditing(req.auth.user.id, id, body); }
  @Delete(':id/edit')
  discardEditing(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.discardEditing(req.auth.user.id, id, body); }
  @Post(':id/edit/publish') @HttpCode(200)
  publishEditing(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.publishEditing(req.auth.user.id, id, body); }
  @Post(':id/edit/questions/from-bank') @HttpCode(200)
  bankEditing(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.fromBank(req.auth.user.id, id, body, true); }
  @Post() create(@Req() req: RecruiterRequest, @Body() body: unknown) { return this.screenings.create(req.auth.user.id, body); }
  @Put(':id') save(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.save(req.auth.user.id, id, body); }
  @Delete(':id') @HttpCode(204)
  remove(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.remove(req.auth.user.id, id, body); }
  @Post(':id/publish') @HttpCode(200)
  publish(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.publish(req.auth.user.id, id, body); }
  @Post(':id/close') @HttpCode(200)
  close(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.close(req.auth.user.id, id, body); }
  @Post(':id/copy') copy(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.copy(req.auth.user.id, id, body); }
  @Post(':id/questions/from-bank') @HttpCode(200)
  bankCopy(@Req() req: RecruiterRequest, @Param('id') id: string, @Body() body: unknown) { return this.screenings.fromBank(req.auth.user.id, id, body); }
}
@Controller('question-bank') @UseGuards(RecruiterGuard)
export class QuestionBankController {
  constructor(private readonly screenings: ScreeningsService) {}
  @Get() @Header('Cache-Control', 'no-store')
  list(@Query('area') area: unknown) { return this.screenings.bank(area); }
}
