import { z } from 'zod';
import { acronymMatchesName, hasThreeEqualLetters } from '../../domain/club-rules.js';
import { countWords } from '../../domain/text.js';
import { boundedText, idParamsSchema } from '../../shared/schemas.js';

const CLUB_NAME_CHARACTERS = /^[\p{L}\p{M} .-]+$/u;
const MIN_WORDS = 2;
const MAX_WORDS = 5;

const clubNameSchema = boundedText(3, 60)
  .refine((name) => CLUB_NAME_CHARACTERS.test(name), {
    error: 'só pode ter letras, espaços, hífen e ponto',
  })
  .refine((name) => countWords(name) >= MIN_WORDS && countWords(name) <= MAX_WORDS, {
    error: `deve ter de ${MIN_WORDS} a ${MAX_WORDS} palavras`,
  });

export const clubIdParams = { params: idParamsSchema };

export const createClubSchemas = {
  body: z
    .object({
      name: clubNameSchema,
      acronym: z
        .string()
        .regex(/^[A-Z]{3}$/, { error: 'deve ter exatamente 3 letras de A a Z maiúsculas' }),
    })
    .superRefine((club, context) => {
      if (hasThreeEqualLetters(club.acronym)) {
        context.addIssue({
          code: 'custom',
          path: ['acronym'],
          message: 'as três letras não podem ser todas iguais',
        });
      } else if (!acronymMatchesName(club.acronym, club.name)) {
        context.addIssue({
          code: 'custom',
          path: ['acronym'],
          message:
            'a sigla deve começar pela primeira letra do nome e ter letras que aparecem nele, na mesma ordem',
        });
      }
    }),
};

export const CLUB_SORT_VALUES = ['name', 'net_worth_asc', 'net_worth_desc'] as const;
export type ClubSort = (typeof CLUB_SORT_VALUES)[number];

export const listClubsSchemas = {
  query: z.object({ sort: z.enum(CLUB_SORT_VALUES).default('name') }),
};

export type CreateClubInput = z.output<typeof createClubSchemas.body>;
