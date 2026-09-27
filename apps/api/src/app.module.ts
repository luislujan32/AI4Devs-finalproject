import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { fileURLToPath } from 'node:url';
import { HealthController } from './health.controller.js';
import { PersistenceModule } from './persistence/persistence.module.js';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27018/screeningroom',
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        retryAttempts: 1,
        retryDelay: 500,
        connectionErrorFactory: () => new Error('MongoDB no está disponible.'),
      }),
    }),
    PersistenceModule,
    ServeStaticModule.forRoot({
      rootPath: fileURLToPath(new URL('../../web/dist/', import.meta.url)),
      exclude: ['/api', '/api/{*path}'],
      serveStaticOptions: { fallthrough: true },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
