import { describe, expect, it } from 'vitest';
import {
  calculateSale,
  isWithinCashLimit,
  penaltyRate,
  purchaseFee,
  remainingDays,
} from '../../src/domain/trading.js';

const cents = (value: number) => Math.round(value * 100);

describe('taxa de compra e limite de caixa (RN13)', () => {
  it.each([
    [28.0, 0],
    [30.0, 0],
    [30.01, 1.5],
    [47.62, 2.38],
  ])('valor %s => taxa %s', (value, fee) => {
    expect(purchaseFee(cents(value))).toBe(cents(fee));
  });

  it('aceita custo igual à metade do caixa e recusa acima dela', () => {
    expect(isWithinCashLimit(cents(50), cents(100))).toBe(true);
    expect(isWithinCashLimit(cents(50.4), cents(100))).toBe(false);
    expect(isWithinCashLimit(cents(130.57), cents(261.15))).toBe(true);
    expect(isWithinCashLimit(cents(130.58), cents(261.15))).toBe(false);
  });
});

describe('fidelidade e multa (RN15)', () => {
  const now = new Date('2026-11-05T19:40:00Z');
  const after = (days: number, extraMinutes = 0) =>
    new Date(now.getTime() + days * 86_400_000 + extraMinutes * 60_000);

  it.each([
    [after(-1), 0, 0],
    [now, 0, 0],
    [after(10, 120), 11, 5],
    [after(30), 30, 5],
    [after(30, 1), 31, 10],
    [after(180), 180, 10],
    [after(180, 1), 181, 20],
    [after(200), 200, 20],
  ])('fim %#', (loyaltyUntil, days, rate) => {
    expect(remainingDays(loyaltyUntil, now)).toBe(days);
    expect(penaltyRate(days)).toBe(rate);
  });
});

describe('venda (RN15 e RN16)', () => {
  const now = new Date('2026-11-05T19:40:00Z');
  const daysAhead = (days: number) => new Date(now.getTime() + days * 86_400_000);

  it.each([
    [37.0, 40.0, 116, 4.0, 3.0, 0.3, 35.7, 'RESCINDIDO'],
    [50.0, 42.5, 200, 8.5, -7.5, 0.0, 34.0, 'RESCINDIDO'],
    [26.15, 30.0, 10, 1.5, 3.85, 0.39, 28.11, 'RESCINDIDO'],
    [25.0, 25.0, 0, 0.0, 0.0, 0.0, 25.0, 'ENCERRADO'],
    [60.0, 75.0, 200, 10.0, 15.0, 2.0, 63.0, 'RESCINDIDO'],
  ])(
    'compra %s, venda %s',
    (purchase, market, days, penalty, profit, commission, credit, status) => {
      const outcome = calculateSale({
        marketValue: cents(market),
        purchaseValue: cents(purchase),
        loyaltyUntil: daysAhead(days),
        now,
      });
      expect(outcome).toMatchObject({
        penalty: cents(penalty),
        profit: cents(profit),
        commission: cents(commission),
        credit: cents(credit),
        contractStatus: status,
      });
    },
  );

  it('cobra comissão progressiva sobre o lucro', () => {
    const commissionFor = (profit: number) =>
      calculateSale({
        marketValue: cents(100 + profit),
        purchaseValue: cents(100),
        loyaltyUntil: now,
        now,
      }).commission;
    expect(commissionFor(10.01)).toBe(cents(1.0));
    expect(commissionFor(15)).toBe(cents(2.0));
    expect(commissionFor(3.85)).toBe(cents(0.39));
  });
});
