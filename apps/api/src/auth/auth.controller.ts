import { Body, Controller, Get, Header, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RecruiterGuard, type RecruiterRequest } from './recruiter.guard.js';

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
  logout(@Req() req: RecruiterRequest, @Res({ passthrough: true }) res: Response) { return this.auth.logout(req, res, req.auth, 'recruiter'); }
}
