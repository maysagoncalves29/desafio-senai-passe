import type { Condition } from './types.js';
import { roundDiv, type Cents } from './money.js';

const MIN_MARKET_VALUE: Cents = 100;
const MAX_DISCOUNT_BASIS_POINTS = 4000;
const BASIS_POINTS_TOTAL = 10000;

const CONDITION_DISCOUNT_BASIS_POINTS: Record<Condition, number> = {
  APTO: 0,
  MAL_CONDICIONADO: 1500,
  DOENTE: 3000,
};

function conditionDiscount(condition: Condition, agility: number): number {
  const discount = CONDITION_DISCOUNT_BASIS_POINTS[condition];
  if (condition === 'APTO') return discount;
  if (agility >= 80) return discount / 2;
  if (agility <= 30) return discount + 1000;
  return discount;
}

function ageAdjustment(age: number): number {
  if (age <= 21) return 1000;
  if (age >= 32) return -1000;
  return 0;
}

export interface MarketValueInput {
  baseValue: Cents;
  condition: Condition;
  agility: number;
  age: number;
}

export function calculateMarketValue(input: MarketValueInput): Cents {
  const totalPercentage = Math.max(
    ageAdjustment(input.age) - conditionDiscount(input.condition, input.agility),
    -MAX_DISCOUNT_BASIS_POINTS,
  );
  const value = roundDiv(
    input.baseValue * (BASIS_POINTS_TOTAL + totalPercentage),
    BASIS_POINTS_TOTAL,
  );
  return Math.max(value, MIN_MARKET_VALUE);
}
