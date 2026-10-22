import type { PlayerFilters, PlayerSort } from '@/api/players';
import { CONDITIONS, POSITIONS, type Condition, type Position } from '@/lib/domain';

export const PLAYERS_PER_PAGE = 10;

export interface PlayerFilterForm {
  search: string;
  position: Position | '';
  condition: Condition | '';
  onlyFree: boolean;
  clubId: string;
  minAge: string;
  maxAge: string;
  minValue: string;
  maxValue: string;
  sort: PlayerSort;
}

export const EMPTY_FILTERS: PlayerFilterForm = {
  search: '',
  position: '',
  condition: '',
  onlyFree: false,
  clubId: '',
  minAge: '',
  maxAge: '',
  minValue: '',
  maxValue: '',
  sort: 'name',
};

export interface BuiltFilters {
  filters: PlayerFilters;
  problems: string[];
}

const MIN_AGE = 16;
const MAX_AGE = 45;
const MAX_VALUE = 550;
const MIN_SEARCH_LENGTH = 2;
const DECIMAL_WITH_UP_TO_TWO_PLACES = /^\d+([.,]\d{1,2})?$/;

function parseAge(text: string, label: string, problems: string[]): number | undefined {
  if (text === '') return undefined;
  const age = Number(text);
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    problems.push(`${label} deve ser um inteiro de ${MIN_AGE} a ${MAX_AGE}.`);
    return undefined;
  }
  return age;
}

function parseValue(text: string, label: string, problems: string[]): number | undefined {
  if (text === '') return undefined;
  const value = Number(text.replace(',', '.'));
  if (!DECIMAL_WITH_UP_TO_TWO_PLACES.test(text) || value > MAX_VALUE) {
    problems.push(`${label} deve ser um valor de 0 a ${MAX_VALUE}, com até 2 casas decimais.`);
    return undefined;
  }
  return value;
}

function parseRange(
  minimum: number | undefined,
  maximum: number | undefined,
  label: string,
  problems: string[],
): void {
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    problems.push(`${label} mínimo não pode ser maior que o máximo.`);
  }
}

export function buildPlayerFilters(form: PlayerFilterForm, page: number): BuiltFilters {
  const problems: string[] = [];
  const search = form.search.trim();
  if (search.length === 1) {
    problems.push(`A busca precisa de pelo menos ${MIN_SEARCH_LENGTH} caracteres.`);
  }
  const minAge = parseAge(form.minAge, 'A idade mínima', problems);
  const maxAge = parseAge(form.maxAge, 'A idade máxima', problems);
  const minValue = parseValue(form.minValue, 'O valor mínimo', problems);
  const maxValue = parseValue(form.maxValue, 'O valor máximo', problems);
  parseRange(minAge, maxAge, 'A idade', problems);
  parseRange(minValue, maxValue, 'O valor', problems);

  return {
    problems,
    filters: {
      search: search.length >= MIN_SEARCH_LENGTH ? search : undefined,
      position: form.position || undefined,
      condition: form.condition || undefined,
      free: form.onlyFree ? true : undefined,
      clubId: form.clubId === '' ? undefined : Number(form.clubId),
      minAge,
      maxAge,
      minValue,
      maxValue,
      sort: form.sort,
      page,
      limit: PLAYERS_PER_PAGE,
    },
  };
}

export function isPosition(value: string): value is Position {
  return (POSITIONS as readonly string[]).includes(value);
}

export function isCondition(value: string): value is Condition {
  return (CONDITIONS as readonly string[]).includes(value);
}
