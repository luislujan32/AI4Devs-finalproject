import { NotFoundException } from '@nestjs/common';
import type { InferSchemaType, Types } from 'mongoose';
import type { domainModels } from '../persistence/models.js';
import type { ScreeningSchema } from '../persistence/schemas.js';

type Models = ReturnType<typeof domainModels>;
type Screening = InferSchemaType<typeof ScreeningSchema> & { _id: Types.ObjectId };
// A missing invitation reference means original v1, never the latest active version.
export async function configurationFor(models: Models, row: Screening, mode: 'active' | 'initial', configurationId?: Types.ObjectId | null) {
  const id = configurationId ?? (mode === 'active' ? row.activeConfigurationId : row.initialConfigurationId);
  if (!id) return row;
  const configuration = await models.ScreeningConfiguration.findOne({ _id: id, screeningId: row._id, ownerId: row.ownerId });
  if (!configuration) throw new NotFoundException('Configuración no disponible.');
  return configuration;
}
