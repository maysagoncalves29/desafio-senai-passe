import type { Club, PrismaClient } from '@prisma/client';
import { LINEUP_SIZE } from '../../domain/lineup.js';
import { playMatch, type MatchSide } from '../../domain/match-engine.js';
import type { Condition, Formation, Position } from '../../domain/types.js';
import type { Database } from '../../infra/prisma.js';
import type { Clock } from '../../shared/clock.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import { requireClub } from '../../shared/lookups.js';
import { clubRepository } from '../clubs/club.repository.js';
import { lineupRepository } from '../lineup/lineup.repository.js';
import { playerRepository } from '../players/player.repository.js';
import { toMatchDetailResponse, toMatchResponse } from './match.mapper.js';
import { matchRepository } from './match.repository.js';

export class MatchService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
  ) {}

  async play(homeClubId: number, awayClubId: number) {
    const playedAt = this.clock.now();

    return this.prisma.$transaction(async (tx) => {
      const clubs = await clubRepository.findByIds(tx, [homeClubId, awayClubId]);
      const home = clubs.find((club) => club.id === homeClubId);
      const away = clubs.find((club) => club.id === awayClubId);
      if (!home || !away) throw new NotFoundError('Clube não encontrado.');

      const homeSide = await this.loadSide(tx, home);
      const awaySide = await this.loadSide(tx, away);
      const outcome = playMatch(homeSide, awaySide);

      const match = await matchRepository.create(tx, {
        homeClubId,
        awayClubId,
        homeGoals: outcome.homeGoals,
        awayGoals: outcome.awayGoals,
        homeFormation: homeSide.formation,
        awayFormation: awaySide.formation,
        playedAt,
        duels: {
          create: outcome.duels.map((duel) => ({
            order: duel.order,
            attackingClubId: duel.attackingClubId,
            attackerId: duel.attacker.playerId,
            defenderId: duel.defender.playerId,
            attackerName: duel.attacker.playerName,
            defenderName: duel.defender.playerName,
            attackerPosition: duel.attacker.position,
            defenderPosition: duel.defender.position,
            attackerCondition: duel.attacker.condition,
            defenderCondition: duel.defender.condition,
            attackAttribute: duel.attacker.attribute,
            defenseAttribute: duel.defender.attribute,
            attackValue: duel.attacker.value,
            defenseValue: duel.defender.value,
            goal: duel.goal,
          })),
        },
      });
      return toMatchDetailResponse(match);
    });
  }

  async list(clubId: number | undefined) {
    if (clubId !== undefined) await requireClub(this.prisma, clubId);
    const matches = await matchRepository.findAll(this.prisma, clubId);
    return matches.map(toMatchResponse);
  }

  async get(id: number) {
    const match = await matchRepository.findById(this.prisma, id);
    if (!match) throw new NotFoundError('Partida não encontrada.');
    return toMatchDetailResponse(match);
  }

  private async loadSide(db: Database, club: Club): Promise<MatchSide> {
    const slots = await lineupRepository.findByClub(db, club.id);
    const players = await playerRepository.findActiveByIds(
      db,
      slots.map((slot) => slot.playerId),
    );
    if (club.formation === null || players.length !== LINEUP_SIZE) {
      throw new ConflictError(`O clube ${club.name} não tem a escalação completa.`);
    }
    return {
      clubId: club.id,
      formation: club.formation as Formation,
      lineup: players.map((player) => ({
        id: player.id,
        name: player.name,
        position: player.position as Position,
        condition: player.condition as Condition,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
      })),
    };
  }
}
