import type { Player } from '@/api/types';
import {
  SECTOR_LABELS,
  SECTOR_POSITIONS,
  lineupSlots,
  type Formation,
  type LineupSector,
} from '@/lib/domain';

export function slotLabels(sectors: LineupSector[]): string[] {
  const counters: Partial<Record<LineupSector, number>> = {};
  return sectors.map((sector) => {
    if (sector === 'goalkeeper') return SECTOR_LABELS[sector];
    counters[sector] = (counters[sector] ?? 0) + 1;
    return `${SECTOR_LABELS[sector]} ${counters[sector]}`;
  });
}

// Distribui os jogadores já escolhidos pelas vagas da formação, na ordem das vagas.
export function assignSlots(formation: Formation, chosen: Player[]): string[] {
  const available = chosen.filter((player) => player.condition !== 'DOENTE');
  return lineupSlots(formation).map((sector) => {
    const index = available.findIndex((player) =>
      SECTOR_POSITIONS[sector].includes(player.position),
    );
    if (index === -1) return '';
    const [player] = available.splice(index, 1);
    return String(player?.id ?? '');
  });
}

export function eligiblePlayers(
  squad: Player[],
  sector: LineupSector,
  takenElsewhere: string[],
): Player[] {
  return squad.filter(
    (player) =>
      SECTOR_POSITIONS[sector].includes(player.position) &&
      player.condition !== 'DOENTE' &&
      !takenElsewhere.includes(String(player.id)),
  );
}
