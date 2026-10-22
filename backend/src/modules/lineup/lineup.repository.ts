import type { LineupSlot } from '@prisma/client';
import type { Database } from '../../infra/prisma.js';

export const lineupRepository = {
  findByClub: (db: Database, clubId: number): Promise<LineupSlot[]> =>
    db.lineupSlot.findMany({ where: { clubId } }),

  async removePlayer(db: Database, playerId: number): Promise<void> {
    await db.lineupSlot.deleteMany({ where: { playerId } });
  },

  async replace(db: Database, clubId: number, playerIds: number[]): Promise<void> {
    await db.lineupSlot.deleteMany({ where: { clubId } });
    await db.lineupSlot.createMany({ data: playerIds.map((playerId) => ({ clubId, playerId })) });
  },
};
