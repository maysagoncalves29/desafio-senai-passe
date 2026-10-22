import type { Match, MatchDuel, Prisma } from '@prisma/client';
import type { Database } from '../../infra/prisma.js';

export type MatchWithClubs = Match & {
  homeClub: { name: string };
  awayClub: { name: string };
};

export type MatchWithDuels = MatchWithClubs & { duels: MatchDuel[] };

const withClubNames = {
  homeClub: { select: { name: true } },
  awayClub: { select: { name: true } },
} as const;

export const matchRepository = {
  create: (db: Database, data: Prisma.MatchUncheckedCreateInput): Promise<MatchWithDuels> =>
    db.match.create({
      data,
      include: { ...withClubNames, duels: { orderBy: { order: 'asc' } } },
    }),

  findAll: (db: Database, clubId: number | undefined): Promise<MatchWithClubs[]> =>
    db.match.findMany({
      where: clubId === undefined ? {} : { OR: [{ homeClubId: clubId }, { awayClubId: clubId }] },
      include: withClubNames,
      orderBy: [{ playedAt: 'desc' }, { id: 'desc' }],
    }),

  findById: (db: Database, id: number): Promise<MatchWithDuels | null> =>
    db.match.findUnique({
      where: { id },
      include: { ...withClubNames, duels: { orderBy: { order: 'asc' } } },
    }),

  findScores: (db: Database) =>
    db.match.findMany({
      select: { homeClubId: true, awayClubId: true, homeGoals: true, awayGoals: true },
    }),
};
