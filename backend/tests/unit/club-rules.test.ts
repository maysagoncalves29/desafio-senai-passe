import { describe, expect, it } from 'vitest';
import { acronymMatchesName, hasThreeEqualLetters } from '../../src/domain/club-rules.js';

describe('sigla do clube', () => {
  it.each([
    ['AGU', 'Águias FC', true],
    ['AFC', 'águias   fc', true],
    ['DEL', 'Delta FC', true],
    ['EPS', 'Épsilon EC', true],
    ['TUB', 'Tubarões EC', true],
    ['GUI', 'Águias FC', false],
    ['XYZ', 'Águias FC', false],
    ['AGG', 'Águias FC', false],
    ['RIO', 'Rio-Branco FC', true],
  ])('%s para "%s" => %s', (acronym, name, expected) => {
    expect(acronymMatchesName(acronym, name)).toBe(expected);
  });

  it('recusa as três letras iguais', () => {
    expect(hasThreeEqualLetters('AAA')).toBe(true);
    expect(hasThreeEqualLetters('AAB')).toBe(false);
  });
});
