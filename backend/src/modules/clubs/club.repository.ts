import type { Club, Player, Prisma } from '@prisma/client';
import type { Database } from '../../infra/prisma.js';

export type ClubWithPlayers = Club & { players: Player[] };

export const clubRepository = {
  findById: (db: Database, id: number): Promise<Club | null> =>
    db.club.findUnique({ where: { id } }),

  findByIds: (db: Database, ids: number[]): Promise<Club[]> =>
    db.club.findMany({ where: { id: { in: ids } } }),

  findWithPlayers: (db: Database, id: number): Promise<ClubWithPlayers | null> =>
    db.club.findUnique({ where: { id }, include: { players: { where: { deletedAt: null } } } }),

  findAllWithPlayers: (db: Database): Promise<ClubWithPlayers[]> =>
    db.club.findMany({ include: { players: { where: { deletedAt: null } } } }),

  findAll: (db: Database): Promise<Club[]> => db.club.findMany(),

  count: (db: Database): Promise<number> => db.club.count(),

  existsByNormalizedName: async (db: Database, normalizedName: string): Promise<boolean> =>
    (await db.club.count({ where: { normalizedName } })) > 0,

  existsByAcronym: async (db: Database, acronym: string): Promise<boolean> =>
    (await db.club.count({ where: { acronym } })) > 0,

  create: (db: Database, data: Prisma.ClubUncheckedCreateInput): Promise<Club> =>
    db.club.create({ data }),

  update: (db: Database, id: number, data: Prisma.ClubUncheckedUpdateInput): Promise<Club> =>
    db.club.update({ where: { id }, data }),

  async lock(db: Database, id: number): Promise<void> {
    await db.$queryRaw`SELECT id FROM clubes WHERE id = ${id} FOR UPDATE`;
  },

  async lockClubCreation(db: Database): Promise<void> {
    await db.$executeRaw`SELECT pg_advisory_xact_lock(7301)`;
  },
};
