import type { ClubTransaction, Prisma } from '@prisma/client';
import type { Database } from '../../infra/prisma.js';

export interface TransactionQuery {
  clubId: number;
  types?: string[] | undefined;
  playerId?: number | undefined;
}

export const transactionRepository = {
  create: (
    db: Database,
    data: Prisma.ClubTransactionUncheckedCreateInput,
  ): Promise<ClubTransaction> => db.clubTransaction.create({ data }),

  findByClub: (db: Database, query: TransactionQuery): Promise<ClubTransaction[]> =>
    db.clubTransaction.findMany({
      where: {
        clubId: query.clubId,
        ...(query.types && { type: { in: query.types } }),
        ...(query.playerId !== undefined && { playerId: query.playerId }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),

  async existsSale(db: Database, clubId: number, playerId: number): Promise<boolean> {
    return (await db.clubTransaction.count({ where: { clubId, playerId, type: 'VENDA' } })) > 0;
  },
};
