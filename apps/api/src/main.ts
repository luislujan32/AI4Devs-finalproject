import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const port = Number(process.env.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT debe ser un puerto válido.');
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(port, '127.0.0.1');
}

bootstrap().catch(() => {
  console.error('No se pudo iniciar Screeningroom. Revisá la configuración y MongoDB.');
  process.exitCode = 1;
});
