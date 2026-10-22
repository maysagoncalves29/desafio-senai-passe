import { roundDiv, type Cents } from './money.js';
import type { ContractStatus } from './types.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FEE_THRESHOLD: Cents = 3000;
const FEE_PERCENTAGE = 5;
const MAX_PENALTY: Cents = 1000;
const COMMISSION_BRACKET_LIMIT: Cents = 1000;
const LOW_COMMISSION_PERCENTAGE = 10;
const HIGH_COMMISSION_PERCENTAGE = 20;

export function purchaseFee(marketValue: Cents): Cents {
  return marketValue > FEE_THRESHOLD ? roundDiv(marketValue * FEE_PERCENTAGE, 100) : 0;
}

// O custo pode ser igual à metade do caixa, mas nunca maior; comparar o dobro evita arredondar o limite.
export function isWithinCashLimit(totalCost: Cents, cash: Cents): boolean {
  return totalCost * 2 <= cash;
}

export function remainingDays(loyaltyUntil: Date, now: Date): number {
  const difference = loyaltyUntil.getTime() - now.getTime();
  return difference <= 0 ? 0 : Math.ceil(difference / MS_PER_DAY);
}

export function penaltyRate(days: number): number {
  if (days <= 0) return 0;
  if (days <= 30) return 5;
  if (days <= 180) return 10;
  return 20;
}

export function contractExposure(loyaltyUntil: Date, now: Date) {
  const days = remainingDays(loyaltyUntil, now);
  return { remainingDays: days, penaltyRate: penaltyRate(days) };
}

function penaltyAmount(marketValue: Cents, rate: number): Cents {
  return Math.min(roundDiv(marketValue * rate, 100), MAX_PENALTY);
}

function saleCommission(profit: Cents): Cents {
  if (profit <= 0) return 0;
  const lowBracket = Math.min(profit, COMMISSION_BRACKET_LIMIT);
  const highBracket = profit - lowBracket;
  return roundDiv(
    lowBracket * LOW_COMMISSION_PERCENTAGE + highBracket * HIGH_COMMISSION_PERCENTAGE,
    100,
  );
}

export interface SaleInput {
  marketValue: Cents;
  purchaseValue: Cents;
  loyaltyUntil: Date;
  now: Date;
}

export interface SaleOutcome {
  remainingDays: number;
  penaltyRate: number;
  penalty: Cents;
  profit: Cents;
  commission: Cents;
  credit: Cents;
  contractStatus: Exclude<ContractStatus, 'ATIVO'>;
}

export function calculateSale(input: SaleInput): SaleOutcome {
  const { remainingDays: days, penaltyRate: rate } = contractExposure(
    input.loyaltyUntil,
    input.now,
  );
  const penalty = penaltyAmount(input.marketValue, rate);
  const profit = input.marketValue - input.purchaseValue;
  const commission = saleCommission(profit);
  return {
    remainingDays: days,
    penaltyRate: rate,
    penalty,
    profit,
    commission,
    credit: input.marketValue - penalty - commission,
    contractStatus: penalty > 0 ? 'RESCINDIDO' : 'ENCERRADO',
  };
}
