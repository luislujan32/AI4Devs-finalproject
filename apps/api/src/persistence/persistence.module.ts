import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { domainDefinitions } from './schemas.js';
import { PersistenceRepository } from './persistence.repository.js';

@Module({
  imports: [MongooseModule.forFeature(domainDefinitions)],
  providers: [PersistenceRepository],
  exports: [MongooseModule, PersistenceRepository],
})
export class PersistenceModule {}
