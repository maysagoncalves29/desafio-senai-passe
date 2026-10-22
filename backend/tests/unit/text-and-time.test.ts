import { describe, expect, it } from 'vitest';
import { formatBrasiliaDateTime, parseBrasiliaDateTime } from '../../src/domain/brasilia-time.js';
import { collapseSpaces, compareNames, countWords } from '../../src/domain/text.js';

describe('datas no horário de Brasília (RN01)', () => {
  it('converte o formato da API para o instante correto', () => {
    expect(parseBrasiliaDateTime('2027-03-02T10:15-03:00')?.toISOString()).toBe(
      '2027-03-02T13:15:00.000Z',
    );
  });

  it.each([
    '2027-03-02T10:15',
    '2027-03-02T10:15Z',
    '2027-03-02T10:15:30-03:00',
    '2027-02-30T10:15-03:00',
    '2027-03-02T24:00-03:00',
    '2027-03-02T10:60-03:00',
    '2027-13-02T10:15-03:00',
    '0050-03-02T10:15-03:00',
  ])('recusa %s', (text) => {
    expect(parseBrasiliaDateTime(text)).toBeNull();
  });

  it('formata com segundos e -03:00', () => {
    expect(formatBrasiliaDateTime(new Date('2027-03-02T13:15:00.000Z'))).toBe(
      '2027-03-02T10:15:00-03:00',
    );
  });
});

describe('textos', () => {
  it('normaliza espaços (V4)', () => {
    expect(collapseSpaces('  Meia   Zeta ')).toBe('Meia Zeta');
  });

  it('conta palavras com pelo menos uma letra', () => {
    expect(countWords('Ana -')).toBe(1);
    expect(countWords('Ana-Maria Lima')).toBe(2);
  });

  it('compara nomes ignorando acentos e caixa, com espaço antes do hífen', () => {
    const sorted = ['Gama SC', 'Épsilon EC', 'Delta FC', 'Ana-Maria', 'Ana Lima'].sort(
      compareNames,
    );
    expect(sorted).toEqual(['Ana Lima', 'Ana-Maria', 'Delta FC', 'Épsilon EC', 'Gama SC']);
    expect(compareNames('Águias FC', 'Aguias FC')).toBe(0);
  });
});
