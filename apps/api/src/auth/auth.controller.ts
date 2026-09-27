import { Body, Controller, Get, Header, HttpCode, Param, Post, Req, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { isObjectIdOrHexString } from 'mongoose';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RecruiterGuard, type RecruiterRequest } from './recruiter.guard.js';
import { domainModels } from '../persistence/models.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Get('csrf')
  csrf(@Res({ passthrough: true }) res: Response) { return this.auth.prelogin(res); }
  @Post('login') @HttpCode(200)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: unknown) { return this.auth.login(req, res, body); }
  @Get('session') @UseGuards(RecruiterGuard) @Header('Cache-Control', 'no-store')
  session(@Req() req: RecruiterRequest) { const { user, csrfToken, expiresAt } = req.auth; return { user, csrfToken, expiresAt }; }
  @Post('logout') @UseGuards(RecruiterGuard) @HttpCode(200)
  logout(@Req() req: RecruiterRequest, @Res({ passthrough: true }) res: Response) { return this.auth.logout(req, res, req.auth); }
}

@Controller('screenings') @UseGuards(RecruiterGuard)
export class RecruiterScreeningsController {
  private readonly models;
  constructor(@InjectConnection() connection: Connection) { this.models = domainModels(connection); }
  @Get() @Header('Cache-Control', 'no-store')
  async list(@Req() req: RecruiterRequest) {
    const rows = await this.models.Screening.find({ ownerId: req.auth.user.id }).sort({ createdAt: -1, _id: -1 }).limit(100)
      .select('_id title area status revision createdAt').lean();
    return { screenings: rows.map((row) => ({ id: row._id.toString(), title: row.title ?? 'Sin título',
      area: row.area ?? '', status: row.status, revision: row.revision, createdAt: row.createdAt })) };
  }
  @Get(':id') @Header('Cache-Control', 'no-store')
  async detail(@Req() req: RecruiterRequest, @Param('id') id: string) {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException('Screening no encontrado.');
    const row = await this.models.Screening.findOne({ _id: id, ownerId: req.auth.user.id }).lean();
    if (!row) throw new NotFoundException('Screening no encontrado.');
    const { _id, ownerId: _owner, ...data } = row;
    void _owner;
    return { id: _id.toString(), ...data };
  }
}
