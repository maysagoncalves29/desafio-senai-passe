import { POSITIONS, type Formation, type Position } from './types.js';
import { compareByNameThenId } from './text.js';

interface FormationSetup {
  defense: number;
  midfield: number;
  attack: number;
}

const FORMATION_SETUPS: Record<Formation, FormationSetup> = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
};

export const LINEUP_SIZE = 5;

function countPositions(positions: Position[], accepted: Position[]): number {
  return positions.filter((position) => accepted.includes(position)).length;
}

export function lineupFitsFormation(positions: Position[], formation: Formation): boolean {
  const setup = FORMATION_SETUPS[formation];
  return (
    positions.length === LINEUP_SIZE &&
    countPositions(positions, ['GOL']) === 1 &&
    countPositions(positions, ['ZAG', 'LAT']) === setup.defense &&
    countPositions(positions, ['MEI']) === setup.midfield &&
    countPositions(positions, ['ATA']) === setup.attack
  );
}

export interface SquadMember {
  id: number;
  name: string;
  position: Position;
}

export function compareSquadOrder(first: SquadMember, second: SquadMember): number {
  return (
    POSITIONS.indexOf(first.position) - POSITIONS.indexOf(second.position) ||
    compareByNameThenId(first, second)
  );
}
