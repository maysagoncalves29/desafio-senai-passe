import { z } from 'zod';
import { collapseSpaces, countCharacters, hasControlCharacters } from '../domain/text.js';

export const MAX_ID = 2_147_483_647;

const DIGITS_WITHOUT_LEADING_ZERO = /^[1-9]\d*$/;
const DECIMAL_WITH_UP_TO_TWO_PLACES = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

export const urlIdSchema = z
  .string()
  .regex(DIGITS_WITHOUT_LEADING_ZERO)
  .transform(Number)
  .refine((id) => id <= MAX_ID);

export const idParamsSchema = z.object({ id: urlIdSchema });

export const bodyIdSchema = z.number().int().positive().max(MAX_ID);

export function boundedInteger(min: number, max: number) {
  return z.number().int().min(min).max(max);
}

export function boundedText(min: number, max: number) {
  return z
    .string()
    .refine((text) => !hasControlCharacters(text), {
      error: 'não pode conter caracteres de controle',
    })
    .transform(collapseSpaces)
    .refine(
      (text) => {
        const length = countCharacters(text);
        return length >= min && length <= max;
      },
      { error: `deve ter de ${min} a ${max} caracteres` },
    );
}

export const queryIntegerSchema = z
  .string()
  .regex(DIGITS_WITHOUT_LEADING_ZERO, { error: 'deve ser um inteiro positivo, só com dígitos' })
  .transform(Number)
  .refine((value) => value <= MAX_ID, { error: 'valor acima do máximo aceito' });

export function queryIntegerBetween(min: number, max: number) {
  return queryIntegerSchema.refine((value) => value >= min && value <= max, {
    error: `deve estar entre ${min} e ${max}`,
  });
}

export function queryDecimalBetween(min: number, max: number) {
  return z
    .string()
    .regex(DECIMAL_WITH_UP_TO_TWO_PLACES, { error: 'deve ter o formato 10, 10.5 ou 10.55' })
    .transform(Number)
    .refine((value) => value >= min && value <= max, { error: `deve estar entre ${min} e ${max}` });
}

export const queryBooleanSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export function uniqueCommaSeparatedList<const Values extends readonly [string, ...string[]]>(
  values: Values,
  maxItems: number,
  keyOf: (value: Values[number]) => string = (value) => value,
) {
  return z
    .string()
    .transform((text) => text.split(','))
    .pipe(z.array(z.enum(values)).min(1).max(maxItems))
    .refine((items) => new Set(items.map(keyOf)).size === items.length, {
      error: 'não repita valores',
    });
}
