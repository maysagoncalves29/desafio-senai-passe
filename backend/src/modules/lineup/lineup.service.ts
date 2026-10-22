import type { PrismaClient } from '@prisma/client';
import { LINEUP_SIZE, lineupFitsFormation } from '../../domain/lineup.js';
import type { Formation, Position } from '../../domain/types.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { requireClub } from '../../shared/lookups.js';
import type { Database } from '../../infra/prisma.js';
import { clubRepository } from '../clubs/club.repository.js';
import { toPlayerResponse } from '../players/player.mapper.js';
import { playerRepository } from '../players/player.repository.js';
import { sortInSquadOrder } from '../players/squad-order.js';
import { lineupRepository } from './lineup.repository.js';

export class LineupService {
  constructor(private readonly prisma: PrismaClient) {}

  async get(clubId: number) {
    const club = await requireClub(this.prisma, clubId);
    return this.describe(this.prisma, club.id, club.formation);
  }

  async replace(clubId: number, formation: Formation, playerIds: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await clubRepository.lock(tx, clubId);
      const club = await requireClub(tx, clubId);

      const players = await playerRepository.findActiveByIds(tx, playerIds);
      if (players.length !== playerIds.length) throw new NotFoundError('Jogador não encontrado.');
      if (players.some((player) => player.clubId !== club.id)) {
        throw new ConflictError('Todos os titulares precisam ser do elenco do clube.');
      }
      if (players.some((player) => player.condition === 'DOENTE')) {
        throw new ConflictError('Jogador DOENTE não pode ser escalado.');
      }
      const positions = players.map((player) => player.position as Position);
      if (!lineupFitsFormation(positions, formation)) {
        throw new ConflictError(
          `As posições dos ${LINEUP_SIZE} titulares não fecham a formação ${formation}.`,
        );
      }

      await lineupRepository.replace(tx, club.id, playerIds);
      await clubRepository.update(tx, club.id, { formation });
      return this.describe(tx, club.id, formation);
    });
  }

  private async describe(db: Database, clubId: number, formation: string | null) {
    const slots = await lineupRepository.findByClub(db, clubId);
    const players = await playerRepository.findActiveByIds(
      db,
      slots.map((slot) => slot.playerId),
    );
    return {
      club_id: clubId,
      formation,
      complete: players.length === LINEUP_SIZE,
      players: sortInSquadOrder(players).map(toPlayerResponse),
    };
  }
}
