import type { Contract, Prisma } from '@prisma/client';
import type { Database } from '../../infra/prisma.js';

export const contractRepository = {
  findActiveByPlayerIds: (db: Database, playerIds: number[]): Promise<Contract[]> =>
    db.contract.findMany({ where: { playerId: { in: playerIds }, status: 'ATIVO' } }),

  findActiveByPlayerId: (db: Database, playerId: number): Promise<Contract | null> =>
    db.contract.findFirst({ where: { playerId, status: 'ATIVO' } }),

  create: (db: Database, data: Prisma.ContractUncheckedCreateInput): Promise<Contract> =>
    db.contract.create({ data }),

  close: (db: Database, id: number, status: string, endedAt: Date): Promise<Contract> =>
    db.contract.update({ where: { id }, data: { status, endedAt } }),
};
