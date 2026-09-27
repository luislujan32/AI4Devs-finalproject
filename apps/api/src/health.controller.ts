import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get('ready')
  async ready() {
    if (this.connection.readyState !== 1 || !this.connection.db) {
      throw new ServiceUnavailableException('La conexión todavía no está disponible.');
    }
    try {
      await this.connection.db.command({ ping: 1 }, { timeoutMS: 1500 });
      return { status: 'ready', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException('La conexión todavía no está disponible.');
    }
  }
}
