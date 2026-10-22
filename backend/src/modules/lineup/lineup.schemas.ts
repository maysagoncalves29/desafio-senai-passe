import { z } from 'zod';
import { LINEUP_SIZE } from '../../domain/lineup.js';
import { FORMATIONS } from '../../domain/types.js';
import { bodyIdSchema, idParamsSchema } from '../../shared/schemas.js';

export const lineupParams = { params: idParamsSchema };

export const replaceLineupSchemas = {
  params: idParamsSchema,
  body: z.object({
    formation: z.enum(FORMATIONS),
    player_ids: z
      .array(bodyIdSchema)
      .length(LINEUP_SIZE, { error: `deve ter exatamente ${LINEUP_SIZE} jogadores` })
      .refine((ids) => new Set(ids).size === ids.length, { error: 'não pode repetir jogadores' }),
  }),
};
