import { compareByNameThenId } from './text.js';

const WIN_POINTS = 3;
const DRAW_POINTS = 1;

export interface StandingsClub {
  id: number;
  name: string;
}

export interface StandingsMatch {
  homeClubId: number;
  awayClubId: number;
  homeGoals: number;
  awayGoals: number;
}

export interface StandingsRow {
  position: number;
  clubId: number;
  clubName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

type TableEntry = Omit<StandingsRow, 'position'>;

function emptyEntry(club: StandingsClub): TableEntry {
  return {
    clubId: club.id,
    clubName: club.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function registerResult(entry: TableEntry, goalsFor: number, goalsAgainst: number): void {
  entry.played += 1;
  entry.goalsFor += goalsFor;
  entry.goalsAgainst += goalsAgainst;
  entry.goalDifference = entry.goalsFor - entry.goalsAgainst;
  if (goalsFor > goalsAgainst) {
    entry.wins += 1;
    entry.points += WIN_POINTS;
  } else if (goalsFor === goalsAgainst) {
    entry.draws += 1;
    entry.points += DRAW_POINTS;
  } else {
    entry.losses += 1;
  }
}

export function calculateStandings(
  clubs: StandingsClub[],
  matches: StandingsMatch[],
): StandingsRow[] {
  const table = new Map(clubs.map((club) => [club.id, emptyEntry(club)]));
  for (const match of matches) {
    registerResult(table.get(match.homeClubId)!, match.homeGoals, match.awayGoals);
    registerResult(table.get(match.awayClubId)!, match.awayGoals, match.homeGoals);
  }
  return [...table.values()]
    .sort(
      (first, second) =>
        second.points - first.points ||
        second.goalDifference - first.goalDifference ||
        second.goalsFor - first.goalsFor ||
        compareByNameThenId(
          { name: first.clubName, id: first.clubId },
          { name: second.clubName, id: second.clubId },
        ),
    )
    .map((entry, index) => ({ position: index + 1, ...entry }));
}
