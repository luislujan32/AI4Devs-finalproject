import { ForbiddenException, HttpException, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type { Request, Response } from 'express';
import { parseCookie, stringifySetCookie } from 'cookie';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { domainModels } from '../persistence/models.js';
import { hashPassword, verifyPassword } from './passwords.js';

const HOURS_8 = 8 * 60 * 60;
const WINDOW = 15 * 60 * 1000;
const nonce = () => randomBytes(32).toString('base64url');
const equal = (a: string, b: string) => {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
export type AuthContext = { sessionId: string; csrfToken: string; expiresAt: Date; user: { id: string; email: string; displayName: string } };

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly models;
  private readonly limits;
  private readonly secret: string;
  private readonly origins: Set<string>;
  private readonly secure: boolean;
  private dummyHash = '';

  constructor(@InjectConnection() connection: Connection) {
    this.models = domainModels(connection);
    if (!connection.db) throw new Error('MongoDB no está disponible.');
    this.limits = connection.db.collection<{ _id: string; count: number; expiresAt: Date }>('auth_limits');
    this.secret = process.env.SESSION_SECRET ?? '';
    if (this.secret.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
    const production = process.env.NODE_ENV === 'production';
    const configured = process.env.PUBLIC_ORIGIN;
    if (production && (!configured || new URL(configured).protocol !== 'https:')) throw new Error('Producción requiere PUBLIC_ORIGIN HTTPS.');
    if (configured && new URL(configured).origin !== configured) throw new Error('PUBLIC_ORIGIN debe ser un origen sin ruta.');
    this.secure = production || (configured ? new URL(configured).protocol === 'https:' : false);
    this.origins = new Set(production ? [configured!] : [
      `http://127.0.0.1:${process.env.API_PORT ?? 3001}`, 'http://127.0.0.1:5173', ...(configured ? [configured] : []),
    ]);
  }

  async onModuleInit() {
    this.dummyHash = await hashPassword(nonce());
    await this.limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  }
  private digest(value: string) { return createHmac('sha256', this.secret).update(value).digest('base64url'); }
  private cookies(req: Request) { return parseCookie(req.headers.cookie ?? ''); }
  private setCookie(res: Response, name: string, value: string, maxAge: number) {
    res.append('Set-Cookie', stringifySetCookie({ name, value, path: '/', httpOnly: true, sameSite: 'lax', secure: this.secure, maxAge }));
    res.setHeader('Cache-Control', 'no-store');
  }
  private checkOrigin(req: Request) {
    if (!req.headers.origin || !this.origins.has(req.headers.origin)) throw new ForbiddenException('Solicitud no autorizada.');
  }
  prelogin(res: Response) {
    const token = nonce();
    const issued = Date.now().toString();
    this.setCookie(res, 'sr_csrf', `${token}.${issued}.${this.digest(`csrf:${token}:${issued}`)}`, WINDOW / 1000);
    return { csrfToken: token };
  }
  private checkLoginCsrf(req: Request) {
    this.checkOrigin(req);
    const [token, issued, tag] = (this.cookies(req).sr_csrf ?? '').split('.');
    const timestamp = Number(issued);
    const header = req.headers['x-csrf-token'];
    if (!token || !issued || !tag || !/^[\w-]{43}$/.test(token) || !Number.isFinite(timestamp)
      || timestamp > Date.now() || Date.now() - timestamp > WINDOW || typeof header !== 'string'
      || !equal(header, token) || !equal(tag, this.digest(`csrf:${token}:${issued}`))) {
      throw new ForbiddenException('Solicitud no autorizada.');
    }
  }
  private async consumeLimit(kind: string, identity: string, maximum: number) {
    const window = Math.floor(Date.now() / WINDOW);
    const key = this.digest(`limit:${kind}:${identity}:${window}`);
    const filter = { _id: key };
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * WINDOW) } };
    let entry;
    try { entry = await this.limits.findOneAndUpdate(filter, update, { upsert: true, returnDocument: 'after' }); }
    catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000) throw error;
      entry = await this.limits.findOneAndUpdate(filter, update, { returnDocument: 'after' });
    }
    if (!entry || entry.count > maximum) throw new HttpException('Demasiados intentos. Volvé a intentar más tarde.', 429);
  }
  async login(req: Request, res: Response, body: unknown) {
    this.checkLoginCsrf(req);
    if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body)
      || typeof body.email !== 'string' || typeof body.password !== 'string'
      || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
      || body.password.length < 1 || body.password.length > 128
      || Object.keys(body).some((key) => !['email', 'password'].includes(key))) throw new UnprocessableEntityException('Datos de acceso inválidos.');
    const email = body.email.trim().toLowerCase();
    await this.consumeLimit('ip', req.socket.remoteAddress ?? 'unknown', 50);
    await this.consumeLimit('email', email, 10);
    const user = await this.models.User.findOne({ email, active: true }).select('+passwordHash');
    const valid = await verifyPassword(user?.passwordHash ?? this.dummyHash, body.password);
    if (!user || !valid) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    const raw = nonce();
    const csrfToken = nonce();
    const expiresAt = new Date(Date.now() + HOURS_8 * 1000);
    const sessionId = this.digest(`session:${raw}`);
    await this.models.Session.create({ sessionId, principal: 'recruiter', userId: user._id, csrfToken, expiresAt });
    const previous = this.cookies(req).sr_session;
    if (previous) await this.models.Session.deleteOne({ sessionId: this.digest(`session:${previous}`) });
    this.setCookie(res, 'sr_session', raw, HOURS_8);
    this.setCookie(res, 'sr_csrf', '', 0);
    return { user: { id: user._id.toString(), email: user.email, displayName: user.displayName }, csrfToken, expiresAt };
  }
  async context(req: Request): Promise<AuthContext> {
    const raw = this.cookies(req).sr_session;
    if (!raw || !/^[\w-]{43}$/.test(raw)) throw new UnauthorizedException('Sesión no disponible.');
    const sessionId = this.digest(`session:${raw}`);
    const session = await this.models.Session.findOne({ sessionId, principal: 'recruiter', expiresAt: { $gt: new Date() } }).select('+csrfToken');
    if (!session?.userId) throw new UnauthorizedException('Sesión no disponible.');
    const user = await this.models.User.findOne({ _id: session.userId, active: true });
    if (!user) throw new UnauthorizedException('Sesión no disponible.');
    return { sessionId, csrfToken: session.csrfToken, expiresAt: session.expiresAt,
      user: { id: user._id.toString(), email: user.email, displayName: user.displayName } };
  }
  checkMutation(req: Request, context: AuthContext) {
    this.checkOrigin(req);
    const token = req.headers['x-csrf-token'];
    if (typeof token !== 'string' || !equal(token, context.csrfToken)) throw new ForbiddenException('Solicitud no autorizada.');
  }
  async logout(req: Request, res: Response, context: AuthContext) {
    this.checkMutation(req, context);
    await this.models.Session.deleteOne({ sessionId: context.sessionId });
    this.setCookie(res, 'sr_session', '', 0);
    return { status: 'signed_out' };
  }
}
