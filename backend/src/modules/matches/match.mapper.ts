import type { MatchDuel } from '@prisma/client';
import { formatBrasiliaDateTime } from '../../domain/brasilia-time.js';
import { resolveMatchResult } from '../../domain/match-engine.js';
import type { MatchWithClubs, MatchWithDuels } from './match.repository.js';

function toDuelResponse(duel: MatchDuel) {
  return {
    order: duel.order,
    attacking_club_id: duel.attackingClubId,
    attacker: {
      player_id: duel.attackerId,
      player_name: duel.attackerName,
      position: duel.attackerPosition,
      condition: duel.attackerCondition,
      attribute: duel.attackAttribute,
      value: duel.attackValue,
    },
    defender: {
      player_id: duel.defenderId,
      player_name: duel.defenderName,
      position: duel.defenderPosition,
      condition: duel.defenderCondition,
      attribute: duel.defenseAttribute,
      value: duel.defenseValue,
    },
    goal: duel.goal,
  };
}

export function toMatchResponse(match: MatchWithClubs) {
  return {
    id: match.id,
    played_at: formatBrasiliaDateTime(match.playedAt),
    home: {
      club_id: match.homeClubId,
      club_name: match.homeClub.name,
      formation: match.homeFormation,
      goals: match.homeGoals,
    },
    away: {
      club_id: match.awayClubId,
      club_name: match.awayClub.name,
      formation: match.awayFormation,
      goals: match.awayGoals,
    },
    result: resolveMatchResult(match.homeGoals, match.awayGoals),
  };
}

export function toMatchDetailResponse(match: MatchWithDuels) {
  return { ...toMatchResponse(match), duels: match.duels.map(toDuelResponse) };
}
