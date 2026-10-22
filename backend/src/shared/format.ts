import type { Cents } from '../domain/money.js';

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

export function formatMoney(cents: Cents): string {
  return moneyFormatter.format(cents / 100);
}
