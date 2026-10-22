import { z } from 'zod';
import { bodyIdSchema, idParamsSchema, queryIntegerSchema } from '../../shared/schemas.js';

export const matchIdParams = { params: idParamsSchema };

export const createMatchSchemas = {
  body: z
    .object({
      home_club_id: bodyIdSchema,
      away_club_id: bodyIdSchema,
    })
    .refine((match) => match.home_club_id !== match.away_club_id, {
      path: ['away_club_id'],
      error: 'o mandante e o visitante devem ser clubes diferentes',
    }),
};

export const listMatchesSchemas = {
  query: z
    .object({ club_id: queryIntegerSchema.optional() })
    .transform((query) => ({ clubId: query.club_id })),
};
