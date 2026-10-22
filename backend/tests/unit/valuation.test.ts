import { describe, expect, it } from 'vitest';
import { calculateMarketValue } from '../../src/domain/market-value.js';
import { calculateOverall } from '../../src/domain/overall.js';
import { calculateBaseValue } from '../../src/domain/base-value.js';
import type { Condition, Position } from '../../src/domain/types.js';

describe('valor de mercado (RN02 a RN05)', () => {
  const cases: [number, Condition, number, number, number][] = [
    [82.0, 'APTO', 20, 25, 82.0],
    [82.0, 'APTO', 50, 19, 90.2],
    [82.0, 'MAL_CONDICIONADO', 50, 25, 69.7],
    [82.0, 'MAL_CONDICIONADO', 80, 21, 84.05],
    [82.0, 'MAL_CONDICIONADO', 30, 33, 53.3],
    [82.0, 'DOENTE', 90, 25, 69.7],
    [82.0, 'DOENTE', 30, 25, 49.2],
    [82.0, 'DOENTE', 10, 40, 49.2],
    [9.5, 'MAL_CONDICIONADO', 85, 25, 8.79],
    [1.0, 'MAL_CONDICIONADO', 50, 35, 1.0],
  ];

  it.each(cases)(
    'base %s, %s, agilidade %s, idade %s => %s',
    (baseValue, condition, agility, age, expected) => {
      const result = calculateMarketValue({
        baseValue: Math.round(baseValue * 100),
        condition,
        agility,
        age,
      });
      expect(result).toBe(Math.round(expected * 100));
    },
  );
});

describe('overall (RN06)', () => {
  const cases: [Position, number[], number][] = [
    ['MEI', [68, 65, 80, 78, 52, 60], 73],
    ['ATA', [78, 75, 73, 82, 48, 68], 76],
    ['LAT', [72, 70, 78, 76, 70, 66], 72],
    ['ZAG', [50, 90, 60, 40, 80, 75], 73],
    ['GOL', [55, 30, 65, 40, 72, 68], 68],
  ];

  it.each(cases)('%s %j => %s', (position, [pace, shooting, passing, dribbling, defending, physical], expected) => {
    const overall = calculateOverall(position, {
      pace: pace!,
      shooting: shooting!,
      passing: passing!,
      dribbling: dribbling!,
      defending: defending!,
      physical: physical!,
    });
    expect(overall).toBe(expected);
  });
});

describe('valor base (RN06)', () => {
  const cases: [number, number, number, number][] = [
    [75, 86, 25, 40.0],
    [60, 70, 30, 10.0],
    [61, 70, 30, 12.0],
    [76, 80, 22, 46.0],
    [85, 92, 27, 100.0],
    [70, 84, 21, 34.2],
    [70, 84, 22, 30.0],
    [45, 90, 18, 3.63],
    [40, 66, 36, 1.0],
  ];

  it.each(cases)('overall %s, potencial %s, idade %s => %s', (overall, potential, age, expected) => {
    expect(calculateBaseValue({ overall, potential, age })).toBe(Math.round(expected * 100));
  });
});
