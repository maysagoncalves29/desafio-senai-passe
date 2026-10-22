import { describe, expect, it } from 'vitest';
import { brasiliaInputAfterDays, toApiDateTime } from './brasilia';
import { formatDateTime, formatMoney, formatSignedMoney } from './format';

describe('formatMoney', () => {
  it('usa 2 casas e vírgula decimal', () => {
    expect(formatMoney(37)).toBe('37,00');
    expect(formatMoney(8.79)).toBe('8,79');
    expect(formatMoney(0)).toBe('0,00');
  });
});

describe('formatSignedMoney', () => {
  it('mostra + para entrada e - para saída', () => {
    expect(formatSignedMoney(35.7)).toBe('+35,70');
    expect(formatSignedMoney(-38.85)).toBe('-38,85');
    expect(formatSignedMoney(0)).toBe('0,00');
  });
});

describe('formatDateTime', () => {
  it('mostra a data e hora no horário de Brasília', () => {
    expect(formatDateTime('2026-11-05T16:40:00-03:00')).toBe('05/11/2026 16:40');
    expect(formatDateTime('2026-11-05T19:40:00Z')).toBe('05/11/2026 16:40');
  });
});

describe('datas digitadas na tela', () => {
  it('envia o campo datetime-local com -03:00', () => {
    expect(toApiDateTime('2027-03-02T10:15')).toBe('2027-03-02T10:15-03:00');
    expect(toApiDateTime('2027-03-02T10:15:30')).toBe('2027-03-02T10:15-03:00');
  });

  it('sugere uma data futura no horário de Brasília', () => {
    const now = new Date('2026-11-02T13:15:00Z');
    expect(brasiliaInputAfterDays(1, now)).toBe('2026-11-03T10:15');
  });
});
