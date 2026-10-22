import type { Player, Prisma } from '@prisma/client';
import type { Database } from '../../infra/prisma.js';

export interface PlayerFilters {
  position?: string | undefined;
  condition?: string | undefined;
  free?: boolean | undefined;
  clubId?: number | undefined;
  minAge?: number | undefined;
  maxAge?: number | undefined;
}

function toWhere(filters: PlayerFilters): Prisma.PlayerWhereInput {
  const clubFilter =
    filters.clubId !== undefined
      ? { clubId: filters.clubId }
      : filters.free === undefined
        ? {}
        : { clubId: filters.free ? null : { not: null } };
  return {
    deletedAt: null,
    ...(filters.position && { position: filters.position }),
    ...(filters.condition && { condition: filters.condition }),
    ...(filters.minAge !== undefined || filters.maxAge !== undefined
      ? { age: { gte: filters.minAge ?? 16, lte: filters.maxAge ?? 45 } }
      : {}),
    ...clubFilter,
  };
}

export const playerRepository = {
  findActiveById: (db: Database, id: number): Promise<Player | null> =>
    db.player.findFirst({ where: { id, deletedAt: null } }),

  findActiveByIds: (db: Database, ids: number[]): Promise<Player[]> =>
    db.player.findMany({ where: { id: { in: ids }, deletedAt: null } }),

  findActiveByClub: (db: Database, clubId: number): Promise<Player[]> =>
    db.player.findMany({ where: { clubId, deletedAt: null } }),

  findAllActive: (db: Database, filters: PlayerFilters): Promise<Player[]> =>
    db.player.findMany({ where: toWhere(filters) }),

  countByClub: (db: Database, clubId: number): Promise<number> =>
    db.player.count({ where: { clubId, deletedAt: null } }),

  create: (db: Database, data: Prisma.PlayerUncheckedCreateInput): Promise<Player> =>
    db.player.create({ data }),

  update: (db: Database, id: number, data: Prisma.PlayerUncheckedUpdateInput): Promise<Player> =>
    db.player.update({ where: { id }, data }),

  async lock(db: Database, id: number): Promise<void> {
    await db.$queryRaw`SELECT id FROM jogadores WHERE id = ${id} FOR UPDATE`;
  },
};
