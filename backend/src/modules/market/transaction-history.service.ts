import type { PrismaClient } from '@prisma/client';
import { summarizeTransactions } from '../../domain/transaction-summary.js';
import { requireActivePlayer, requireClub } from '../../shared/lookups.js';
import type { TransactionFilter } from './market.schemas.js';
import { toSummarizable, toSummaryResponse, toTransactionResponse } from './transaction.mapper.js';
import { transactionRepository } from './transaction.repository.js';
import { buildTransactionsCsv } from './transactions-csv.js';

export class TransactionHistoryService {
  constructor(private readonly prisma: PrismaClient) {}

  private async load(clubId: number, filter: TransactionFilter) {
    await requireClub(this.prisma, clubId);
    if (filter.playerId !== undefined) await requireActivePlayer(this.prisma, filter.playerId);
    return transactionRepository.findByClub(this.prisma, { clubId, ...filter });
  }

  async list(clubId: number, filter: TransactionFilter) {
    const transactions = await this.load(clubId, filter);
    return {
      data: transactions.map(toTransactionResponse),
      summary: toSummaryResponse(summarizeTransactions(transactions.map(toSummarizable))),
    };
  }

  async exportCsv(clubId: number, filter: TransactionFilter): Promise<string> {
    return buildTransactionsCsv(await this.load(clubId, filter));
  }
}
