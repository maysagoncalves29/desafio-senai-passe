import { compareSquadOrder } from './lineup.js';
import type { AttributeName, Condition, Formation, Position } from './types.js';

const INJURED_PENALTY_PERCENTAGE = 85;

export interface MatchPlayer {
  id: number;
  name: string;
  position: Position;
  condition: Condition;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
}

export interface MatchSide {
  clubId: number;
  formation: Formation;
  lineup: MatchPlayer[];
}

export interface DuelParticipant {
  playerId: number;
  playerName: string;
  position: Position;
  condition: Condition;
  attribute: AttributeName;
  value: number;
}

export interface Duel {
  order: number;
  attackingClubId: number;
  attacker: DuelParticipant;
  defender: DuelParticipant;
  goal: boolean;
}

export type MatchResult = 'MANDANTE' | 'VISITANTE' | 'EMPATE';

export interface MatchOutcome {
  homeGoals: number;
  awayGoals: number;
  duels: Duel[];
}

const ATTACK_ATTRIBUTE: Record<Exclude<Position, 'GOL'>, AttributeName> = {
  ATA: 'shooting',
  MEI: 'passing',
  ZAG: 'dribbling',
  LAT: 'dribbling',
};

export function resolveMatchResult(homeGoals: number, awayGoals: number): MatchResult {
  if (homeGoals === awayGoals) return 'EMPATE';
  return homeGoals > awayGoals ? 'MANDANTE' : 'VISITANTE';
}

function effectiveValue(player: MatchPlayer, attribute: AttributeName): number {
  const value = player[attribute as keyof MatchPlayer] as number;
  return player.condition === 'MAL_CONDICIONADO'
    ? Math.floor((value * INJURED_PENALTY_PERCENTAGE + 50) / 100)
    : value;
}

function participant(player: MatchPlayer, attribute: AttributeName): DuelParticipant {
  return {
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    condition: player.condition,
    attribute,
    value: effectiveValue(player, attribute),
  };
}

interface Squad {
  goalkeeper: MatchPlayer;
  fieldPlayers: MatchPlayer[];
}

function organizeSquad(lineup: MatchPlayer[]): Squad {
  const ordered = [...lineup].sort(compareSquadOrder);
  return { goalkeeper: ordered[0]!, fieldPlayers: ordered.slice(1) };
}

// Atacantes (4º, 3º e 2º jogador de linha) contra defensores (goleiro, 1º e 2º do adversário).
function attacksAgainst(attacking: Squad, defending: Squad): [MatchPlayer, MatchPlayer][] {
  const { fieldPlayers } = attacking;
  return [
    [fieldPlayers[3]!, defending.goalkeeper],
    [fieldPlayers[2]!, defending.fieldPlayers[0]!],
    [fieldPlayers[1]!, defending.fieldPlayers[1]!],
  ];
}

function disputeDuels(
  attackingClubId: number,
  attacking: Squad,
  defending: Squad,
  firstOrder: number,
): Duel[] {
  return attacksAgainst(attacking, defending).map(([attacker, defender], index) => {
    const attackParticipant = participant(
      attacker,
      ATTACK_ATTRIBUTE[attacker.position as Exclude<Position, 'GOL'>],
    );
    const defenseParticipant = participant(defender, 'defending');
    return {
      order: firstOrder + index,
      attackingClubId,
      attacker: attackParticipant,
      defender: defenseParticipant,
      goal: attackParticipant.value > defenseParticipant.value,
    };
  });
}

function countGoals(duels: Duel[]): number {
  return duels.filter((duel) => duel.goal).length;
}

export function playMatch(home: MatchSide, away: MatchSide): MatchOutcome {
  const homeSquad = organizeSquad(home.lineup);
  const awaySquad = organizeSquad(away.lineup);
  const homeDuels = disputeDuels(home.clubId, homeSquad, awaySquad, 1);
  const awayDuels = disputeDuels(away.clubId, awaySquad, homeSquad, 4);
  return {
    homeGoals: countGoals(homeDuels),
    awayGoals: countGoals(awayDuels),
    duels: [...homeDuels, ...awayDuels],
  };
}
