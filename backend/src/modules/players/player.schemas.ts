import { z } from 'zod';
import { CONDITIONS, POSITIONS } from '../../domain/types.js';
import { countWords, normalizeForSearch } from '../../domain/text.js';
import {
  boundedInteger,
  boundedText,
  idParamsSchema,
  queryBooleanSchema,
  queryDecimalBetween,
  queryIntegerBetween,
  queryIntegerSchema,
  uniqueCommaSeparatedList,
} from '../../shared/schemas.js';

const MAX_ATTRIBUTE_SUM = 480;
const AGE_WITH_AGILITY_LIMIT = 35;
const MAX_AGILITY_FOR_VETERANS = 85;
const AGE_WITH_FIXED_POTENTIAL = 33;

const playerNameSchema = boundedText(3, 100)
  .refine((name) => countWords(name) >= 2, { error: 'deve ter pelo menos duas palavras' })
  .refine((name) => !/[0-9]/.test(name), { error: 'não pode conter dígitos' });

const attributeSchema = boundedInteger(1, 99);

const editableFields = {
  name: playerNameSchema,
  position: z.enum(POSITIONS),
  agility: boundedInteger(1, 100),
  age: boundedInteger(16, 45),
};

function checkAgilityForAge(
  player: { age: number; agility: number },
  context: z.RefinementCtx,
): void {
  if (player.age >= AGE_WITH_AGILITY_LIMIT && player.agility > MAX_AGILITY_FOR_VETERANS) {
    context.addIssue({
      code: 'custom',
      path: ['agility'],
      message: `com ${AGE_WITH_AGILITY_LIMIT} anos ou mais, a agilidade vai no máximo até ${MAX_AGILITY_FOR_VETERANS}`,
    });
  }
}

export const playerIdParams = { params: idParamsSchema };

export const createPlayerSchemas = {
  body: z
    .object({
      ...editableFields,
      pace: attributeSchema,
      shooting: attributeSchema,
      passing: attributeSchema,
      dribbling: attributeSchema,
      defending: attributeSchema,
      physical: attributeSchema,
      potential: attributeSchema,
    })
    .superRefine((player, context) => {
      checkAgilityForAge(player, context);
      const attributes = [
        player.pace,
        player.shooting,
        player.passing,
        player.dribbling,
        player.defending,
        player.physical,
      ];
      if (attributes.reduce((sum, value) => sum + value, 0) > MAX_ATTRIBUTE_SUM) {
        context.addIssue({
          code: 'custom',
          path: ['pace'],
          message: `a soma dos seis atributos não pode passar de ${MAX_ATTRIBUTE_SUM}`,
        });
      }
      const highestAttribute = Math.max(...attributes);
      if (player.potential < highestAttribute) {
        context.addIssue({
          code: 'custom',
          path: ['potential'],
          message: 'o potencial não pode ser menor que o maior atributo',
        });
      } else if (player.age >= AGE_WITH_FIXED_POTENTIAL && player.potential !== highestAttribute) {
        context.addIssue({
          code: 'custom',
          path: ['potential'],
          message: `com ${AGE_WITH_FIXED_POTENTIAL} anos ou mais, o potencial é igual ao maior atributo`,
        });
      }
    }),
};

export const updatePlayerSchemas = {
  ...playerIdParams,
  body: z.object(editableFields).superRefine(checkAgilityForAge),
};

export const changeConditionSchemas = {
  ...playerIdParams,
  body: z.object({ condition: z.enum(CONDITIONS) }),
};

const PLAYER_SORT_VALUES = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
] as const;

export type PlayerSort = (typeof PLAYER_SORT_VALUES)[number];

const sortField = (sort: PlayerSort) => sort.split('_')[0]!;

export const listPlayersSchemas = {
  query: z
    .object({
      search: boundedText(2, 100).optional(),
      position: z.enum(POSITIONS).optional(),
      condition: z.enum(CONDITIONS).optional(),
      free: queryBooleanSchema.optional(),
      club_id: queryIntegerSchema.optional(),
      min_age: queryIntegerBetween(16, 45).optional(),
      max_age: queryIntegerBetween(16, 45).optional(),
      min_value: queryDecimalBetween(0, 550).optional(),
      max_value: queryDecimalBetween(0, 550).optional(),
      sort: uniqueCommaSeparatedList(PLAYER_SORT_VALUES, 2, sortField).default(['name']),
      page: queryIntegerSchema.default(1),
      limit: queryIntegerBetween(1, 50).default(10),
    })
    .superRefine((query, context) => {
      if (
        query.min_age !== undefined &&
        query.max_age !== undefined &&
        query.min_age > query.max_age
      ) {
        context.addIssue({
          code: 'custom',
          path: ['min_age'],
          message: 'min_age não pode ser maior que max_age',
        });
      }
      if (
        query.min_value !== undefined &&
        query.max_value !== undefined &&
        query.min_value > query.max_value
      ) {
        context.addIssue({
          code: 'custom',
          path: ['min_value'],
          message: 'min_value não pode ser maior que max_value',
        });
      }
      if (query.free === true && query.club_id !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['free'],
          message: 'free=true não pode ser combinado com club_id',
        });
      }
    })
    .transform((query) => ({
      search: query.search === undefined ? undefined : normalizeForSearch(query.search),
      position: query.position,
      condition: query.condition,
      free: query.free,
      clubId: query.club_id,
      minAge: query.min_age,
      maxAge: query.max_age,
      minValueCents: query.min_value === undefined ? undefined : Math.round(query.min_value * 100),
      maxValueCents: query.max_value === undefined ? undefined : Math.round(query.max_value * 100),
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    })),
};

export type PlayerListQuery = z.output<typeof listPlayersSchemas.query>;
export type CreatePlayerInput = z.output<typeof createPlayerSchemas.body>;
export type UpdatePlayerInput = z.output<typeof updatePlayerSchemas.body>;
