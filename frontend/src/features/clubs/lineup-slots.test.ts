import { describe, expect, it } from 'vitest';
import type { Player } from '@/api/types';
import type { Condition, Position } from '@/lib/domain';
import { assignSlots, eligiblePlayers, slotLabels } from './lineup-slots';
import { lineupSlots } from '@/lib/domain';

function player(id: number, position: Position, condition: Condition = 'APTO'): Player {
  return {
    id,
    name: `Jogador ${id}`,
    position,
    agility: 50,
    age: 25,
    condition,
    base_value: 10,
    market_value: 10,
    pace: 50,
    shooting: 50,
    passing: 50,
    dribbling: 50,
    defending: 50,
    physical: 50,
    potential: 60,
    overall: 55,
    club_id: 1,
  };
}

const squad = [
  player(1, 'GOL'),
  player(2, 'ZAG'),
  player(3, 'LAT'),
  player(4, 'MEI'),
  player(5, 'ATA'),
];

describe('vagas da escalação', () => {
  it('gera as vagas de cada formação com o goleiro primeiro', () => {
    expect(lineupSlots('2-1-1')).toEqual([
      'goalkeeper',
      'defense',
      'defense',
      'midfield',
      'attack',
    ]);
    expect(lineupSlots('3-1')).toEqual(['goalkeeper', 'defense', 'defense', 'defense', 'attack']);
    expect(slotLabels(lineupSlots('1-2-1'))).toEqual([
      'Goleiro',
      'Defesa 1',
      'Meio 1',
      'Meio 2',
      'Ataque 1',
    ]);
  });

  it('distribui os jogadores pelas vagas conforme a posição', () => {
    expect(assignSlots('2-1-1', squad)).toEqual(['1', '2', '3', '4', '5']);
    expect(assignSlots('2-2', squad)).toEqual(['1', '2', '3', '5', '']);
  });

  it('não escala jogador doente', () => {
    const withSickStriker = [...squad.slice(0, 4), player(5, 'ATA', 'DOENTE')];
    expect(assignSlots('2-1-1', withSickStriker)[4]).toBe('');
  });

  it('lista só jogadores livres de impedimento para cada vaga', () => {
    const options = eligiblePlayers([...squad, player(6, 'ZAG', 'DOENTE')], 'defense', ['2']);
    expect(options.map((option) => option.id)).toEqual([3]);
  });
});
