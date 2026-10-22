import type { Attributes, Position } from './types.js';

const WEIGHTS: Record<Position, Attributes> = {
  GOL: { pace: 10, shooting: 0, passing: 20, dribbling: 0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting: 0, passing: 15, dribbling: 0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting: 0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending: 5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending: 0, physical: 10 },
};

export function calculateOverall(position: Position, attributes: Attributes): number {
  const weights = WEIGHTS[position];
  const weightedSum =
    attributes.pace * weights.pace +
    attributes.shooting * weights.shooting +
    attributes.passing * weights.passing +
    attributes.dribbling * weights.dribbling +
    attributes.defending * weights.defending +
    attributes.physical * weights.physical;
  return Math.floor((weightedSum + 50) / 100);
}
