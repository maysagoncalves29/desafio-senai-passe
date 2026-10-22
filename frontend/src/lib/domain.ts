export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campista',
  ATA: 'Atacante',
};

export const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONDITION_LABELS: Record<Condition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
};

export const FORMATIONS = ['3-1', '2-2', '2-1-1', '1-2-1'] as const;
export type Formation = (typeof FORMATIONS)[number];

export type LineupSector = 'goalkeeper' | 'defense' | 'midfield' | 'attack';

export const SECTOR_POSITIONS: Record<LineupSector, readonly Position[]> = {
  goalkeeper: ['GOL'],
  defense: ['ZAG', 'LAT'],
  midfield: ['MEI'],
  attack: ['ATA'],
};

export const SECTOR_LABELS: Record<LineupSector, string> = {
  goalkeeper: 'Goleiro',
  defense: 'Defesa',
  midfield: 'Meio',
  attack: 'Ataque',
};

const FORMATION_SECTORS: Record<Formation, readonly [number, number, number]> = {
  '3-1': [3, 0, 1],
  '2-2': [2, 0, 2],
  '2-1-1': [2, 1, 1],
  '1-2-1': [1, 2, 1],
};

export function lineupSlots(formation: Formation): LineupSector[] {
  const [defense, midfield, attack] = FORMATION_SECTORS[formation];
  return [
    'goalkeeper',
    ...Array<LineupSector>(defense).fill('defense'),
    ...Array<LineupSector>(midfield).fill('midfield'),
    ...Array<LineupSector>(attack).fill('attack'),
  ];
}

export const MAX_SQUAD_SIZE = 12;
