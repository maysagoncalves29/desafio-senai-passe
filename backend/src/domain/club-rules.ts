import { normalizeForSearch } from './text.js';

export const MAX_CLUBS = 20;
export const MAX_SQUAD_SIZE = 12;

const LATIN_LETTER = /[a-z]/;

function lettersOf(name: string): string[] {
  return Array.from(normalizeForSearch(name)).filter((character) => LATIN_LETTER.test(character));
}

// A sigla tem 3 letras que aparecem no nome nessa ordem, começando pela primeira letra do nome.
export function acronymMatchesName(acronym: string, name: string): boolean {
  const wanted = Array.from(acronym.toLowerCase());
  const available = lettersOf(name);
  if (wanted[0] !== available[0]) return false;

  let searchFrom = 0;
  return wanted.every((letter) => {
    const found = available.indexOf(letter, searchFrom);
    searchFrom = found + 1;
    return found !== -1;
  });
}

export function hasThreeEqualLetters(acronym: string): boolean {
  return new Set(acronym).size === 1;
}
