import type { Player } from '@prisma/client';
import { compareSquadOrder } from '../../domain/lineup.js';
import type { Position } from '../../domain/types.js';

export function sortInSquadOrder(players: Player[]): Player[] {
  const asMember = (player: Player) => ({ ...player, position: player.position as Position });
  return [...players].sort((first, second) => compareSquadOrder(asMember(first), asMember(second)));
}
