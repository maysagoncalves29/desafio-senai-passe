import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, buildPlayerFilters } from './player-filters';

describe('buildPlayerFilters', () => {
  it('monta os filtros com a paginação de 10 por página', () => {
    const { filters, problems } = buildPlayerFilters(
      { ...EMPTY_FILTERS, search: ' joao ', position: 'MEI', minValue: '10,5', sort: 'value_desc' },
      2,
    );
    expect(problems).toEqual([]);
    expect(filters).toMatchObject({
      search: 'joao',
      position: 'MEI',
      minValue: 10.5,
      sort: 'value_desc',
      page: 2,
      limit: 10,
    });
  });

  it('não envia a busca de um só caractere e avisa o motivo', () => {
    const { filters, problems } = buildPlayerFilters({ ...EMPTY_FILTERS, search: 'a' }, 1);
    expect(filters.search).toBeUndefined();
    expect(problems).toHaveLength(1);
  });

  it('aponta faixas contraditórias e valores fora do limite', () => {
    const { problems } = buildPlayerFilters(
      { ...EMPTY_FILTERS, minAge: '40', maxAge: '20', minValue: '600', maxValue: '10' },
      1,
    );
    expect(problems).toEqual(
      expect.arrayContaining([
        'A idade mínimo não pode ser maior que o máximo.',
        expect.stringContaining('O valor mínimo'),
      ]),
    );
  });

  it('só filtra livres quando marcado', () => {
    expect(buildPlayerFilters(EMPTY_FILTERS, 1).filters.free).toBeUndefined();
    expect(buildPlayerFilters({ ...EMPTY_FILTERS, onlyFree: true }, 1).filters.free).toBe(true);
  });
});
