import { z } from 'zod';
import { parseBrasiliaDateTime } from '../../domain/brasilia-time.js';
import { TRANSACTION_TYPES } from '../../domain/types.js';
import {
  bodyIdSchema,
  idParamsSchema,
  queryIntegerSchema,
  uniqueCommaSeparatedList,
} from '../../shared/schemas.js';

const loyaltyUntilSchema = z
  .string()
  .refine((text) => parseBrasiliaDateTime(text) !== null, {
    error: 'use o formato AAAA-MM-DDTHH:MM-03:00 com uma data e hora existentes',
  })
  .transform((text) => parseBrasiliaDateTime(text)!);

export const buyPlayerSchemas = {
  params: idParamsSchema,
  body: z.object({
    club_id: bodyIdSchema,
    loyalty_until: loyaltyUntilSchema,
  }),
};

export const sellPlayerSchemas = { params: idParamsSchema };

export const transactionHistorySchemas = {
  params: idParamsSchema,
  query: z
    .object({
      type: uniqueCommaSeparatedList(TRANSACTION_TYPES, 2).optional(),
      player_id: queryIntegerSchema.optional(),
    })
    .transform((query) => ({ types: query.type, playerId: query.player_id })),
};

export type TransactionFilter = z.output<typeof transactionHistorySchemas.query>;
