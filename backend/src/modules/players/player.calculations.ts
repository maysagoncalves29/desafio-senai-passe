import type { Player } from '@prisma/client';
import { calculateMarketValue } from '../../domain/market-value.js';
import { toCents, type Cents } from '../../domain/money.js';
import { calculateOverall } from '../../domain/overall.js';
import type { Condition, Position } from '../../domain/types.js';

export function marketValueOf(player: Player): Cents {
  return calculateMarketValue({
    baseValue: toCents(player.baseValue),
    condition: player.condition as Condition,
    agility: player.agility,
    age: player.age,
  });
}

export function overallOf(player: Player): number {
  return calculateOverall(player.position as Position, player);
}
