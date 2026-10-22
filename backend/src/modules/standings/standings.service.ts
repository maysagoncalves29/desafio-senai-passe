import type { PrismaClient } from '@prisma/client';
import { calculateStandings } from '../../domain/standings.js';
import { clubRepository } from '../clubs/club.repository.js';
import { matchRepository } from '../matches/match.repository.js';

export class StandingsService {
  constructor(private readonly prisma: PrismaClient) {}

  async get() {
    const [clubs, scores] = await Promise.all([
      clubRepository.findAll(this.prisma),
      matchRepository.findScores(this.prisma),
    ]);
    return calculateStandings(clubs, scores).map((row) => ({
      position: row.position,
      club_id: row.clubId,
      club_name: row.clubName,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goalsFor,
      goals_against: row.goalsAgainst,
      goal_difference: row.goalDifference,
      points: row.points,
    }));
  }
}
