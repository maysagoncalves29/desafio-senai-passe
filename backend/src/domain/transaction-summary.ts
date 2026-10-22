import type { Cents } from './money.js';
import type { TransactionType } from './types.js';

export interface SummarizableTransaction {
  type: TransactionType;
  value: Cents;
  fee: Cents;
  penalty: Cents;
  profit: Cents | null;
  cashChange: Cents;
}

export interface TransactionSummary {
  totalSpent: Cents;
  totalReceived: Cents;
  totalFees: Cents;
  totalPenalties: Cents;
  totalProfit: Cents;
}

export function summarizeTransactions(transactions: SummarizableTransaction[]): TransactionSummary {
  const summary: TransactionSummary = {
    totalSpent: 0,
    totalReceived: 0,
    totalFees: 0,
    totalPenalties: 0,
    totalProfit: 0,
  };
  for (const transaction of transactions) {
    summary.totalFees += transaction.fee;
    if (transaction.type === 'COMPRA') {
      summary.totalSpent += transaction.value + transaction.fee;
    } else {
      summary.totalReceived += transaction.cashChange;
      summary.totalPenalties += transaction.penalty;
      summary.totalProfit += transaction.profit ?? 0;
    }
  }
  return summary;
}
