import type { ClubTransaction } from '@prisma/client';
import { formatBrasiliaDateTime } from '../../domain/brasilia-time.js';
import { fromCents, toCents } from '../../domain/money.js';
import type {
  SummarizableTransaction,
  TransactionSummary,
} from '../../domain/transaction-summary.js';
import type { TransactionType } from '../../domain/types.js';

export function toTransactionResponse(transaction: ClubTransaction) {
  return {
    id: transaction.id,
    club_id: transaction.clubId,
    player_id: transaction.playerId,
    player_name: transaction.playerName,
    type: transaction.type,
    value: fromCents(toCents(transaction.value)),
    fee: fromCents(toCents(transaction.fee)),
    penalty: fromCents(toCents(transaction.penalty)),
    profit: transaction.profit === null ? null : fromCents(toCents(transaction.profit)),
    cash_change: fromCents(toCents(transaction.cashChange)),
    created_at: formatBrasiliaDateTime(transaction.createdAt),
  };
}

export function toSummarizable(transaction: ClubTransaction): SummarizableTransaction {
  return {
    type: transaction.type as TransactionType,
    value: toCents(transaction.value),
    fee: toCents(transaction.fee),
    penalty: toCents(transaction.penalty),
    profit: transaction.profit === null ? null : toCents(transaction.profit),
    cashChange: toCents(transaction.cashChange),
  };
}

export function toSummaryResponse(summary: TransactionSummary) {
  return {
    total_spent: fromCents(summary.totalSpent),
    total_received: fromCents(summary.totalReceived),
    total_fees: fromCents(summary.totalFees),
    total_penalties: fromCents(summary.totalPenalties),
    total_profit: fromCents(summary.totalProfit),
  };
}
