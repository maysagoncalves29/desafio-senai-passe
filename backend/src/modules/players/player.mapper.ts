import type { Player } from '@prisma/client';
import { fromCents, toCents } from '../../domain/money.js';
import { marketValueOf, overallOf } from './player.calculations.js';

export function toPlayerResponse(player: Player) {
  return {
    id: player.id,
    name: player.name,
    position: player.position,
    agility: player.agility,
    age: player.age,
    condition: player.condition,
    base_value: fromCents(toCents(player.baseValue)),
    market_value: fromCents(marketValueOf(player)),
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
    potential: player.potential,
    overall: overallOf(player),
    club_id: player.clubId,
  };
}
