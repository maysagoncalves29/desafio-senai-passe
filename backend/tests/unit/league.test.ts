import { describe, expect, it } from 'vitest';
import { playMatch, resolveMatchResult, type MatchPlayer } from '../../src/domain/match-engine.js';
import { calculateStandings } from '../../src/domain/standings.js';
import { lineupFitsFormation } from '../../src/domain/lineup.js';
import { summarizeTransactions } from '../../src/domain/transaction-summary.js';

function player(overrides: Partial<MatchPlayer> & Pick<MatchPlayer, 'id' | 'name' | 'position'>): MatchPlayer {
  return {
    condition: 'APTO',
    shooting: 0,
    passing: 0,
    dribbling: 0,
    defending: 0,
    ...overrides,
  };
}

const eagles = [
  player({ id: 34, name: 'Otto Rangel', position: 'ATA', shooting: 75 }),
  player({ id: 31, name: 'Davi Lins', position: 'LAT', condition: 'MAL_CONDICIONADO', dribbling: 74, defending: 66 }),
  player({ id: 30, name: 'Rui Prado', position: 'GOL', defending: 77 }),
  player({ id: 33, name: 'Lauro Neves', position: 'MEI', passing: 82 }),
  player({ id: 32, name: 'Téo Brandão', position: 'ZAG', defending: 84 }),
];

const delta = [
  player({ id: 44, name: 'Ugo Falcão', position: 'ATA', shooting: 81 }),
  player({ id: 42, name: 'Lino Matos', position: 'LAT', dribbling: 79, defending: 63 }),
  player({ id: 40, name: 'Ivo Teles', position: 'GOL', defending: 72 }),
  player({ id: 43, name: 'Nei Soares', position: 'MEI', passing: 70 }),
  player({ id: 41, name: 'Hugo Vaz', position: 'ZAG', defending: 84 }),
];

describe('partida (RN20)', () => {
  const outcome = playMatch(
    { clubId: 1, formation: '2-1-1', lineup: eagles },
    { clubId: 2, formation: '2-1-1', lineup: delta },
  );

  it('calcula o placar do exemplo do enunciado', () => {
    expect(outcome.homeGoals).toBe(1);
    expect(outcome.awayGoals).toBe(2);
    expect(resolveMatchResult(outcome.homeGoals, outcome.awayGoals)).toBe('VISITANTE');
  });

  it('numera os 6 duelos e define quem ataca e defende', () => {
    expect(outcome.duels.map((duel) => duel.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(outcome.duels.map((duel) => duel.goal)).toEqual([true, false, false, true, false, true]);
    expect(outcome.duels[0]).toMatchObject({
      attackingClubId: 1,
      attacker: { playerName: 'Otto Rangel', attribute: 'shooting', value: 75 },
      defender: { playerName: 'Ivo Teles', attribute: 'defending', value: 72 },
    });
  });

  it('reduz 15% dos atributos do titular mal condicionado, arredondando o meio para cima', () => {
    expect(outcome.duels[2]!.attacker.value).toBe(63);
    expect(outcome.duels[5]!.defender.value).toBe(56);
  });

  it('não marca gol em duelo empatado', () => {
    const tied = playMatch(
      { clubId: 1, formation: '2-1-1', lineup: eagles },
      { clubId: 2, formation: '2-1-1', lineup: delta },
    );
    expect(tied.duels[2]!.attacker.value).toBe(tied.duels[2]!.defender.value);
    expect(tied.duels[2]!.goal).toBe(false);
  });
});

describe('arredondamento do meio na condição (RN20)', () => {
  it('50 x 0,85 = 42,5 vira 43', () => {
    const injured = player({ id: 1, name: 'Ana Dois', position: 'ATA', condition: 'MAL_CONDICIONADO', shooting: 50 });
    const outcome = playMatch(
      { clubId: 1, formation: '2-1-1', lineup: [injured, ...eagles.filter((p) => p.position !== 'ATA')] },
      { clubId: 2, formation: '2-1-1', lineup: delta },
    );
    expect(outcome.duels[0]!.attacker.value).toBe(43);
  });
});

describe('classificação (RN21)', () => {
  const clubs = [
    { id: 1, name: 'Águias FC' },
    { id: 2, name: 'Delta FC' },
    { id: 3, name: 'Épsilon EC' },
    { id: 4, name: 'Gama SC' },
    { id: 5, name: 'Mangue FC' },
    { id: 6, name: 'Tubarões EC' },
  ];
  const matches = [
    { homeClubId: 1, awayClubId: 2, homeGoals: 1, awayGoals: 2 },
    { homeClubId: 4, awayClubId: 3, homeGoals: 2, awayGoals: 1 },
    { homeClubId: 3, awayClubId: 1, homeGoals: 3, awayGoals: 2 },
    { homeClubId: 2, awayClubId: 4, homeGoals: 0, awayGoals: 1 },
  ];

  it('ordena por pontos, saldo, gols marcados e nome', () => {
    const table = calculateStandings(clubs, matches);
    expect(table.map((row) => row.clubName)).toEqual([
      'Gama SC',
      'Épsilon EC',
      'Delta FC',
      'Mangue FC',
      'Tubarões EC',
      'Águias FC',
    ]);
    expect(table.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(table[0]).toMatchObject({ points: 6, goalDifference: 2, goalsFor: 3 });
  });
});

describe('escalação por formação (RN19)', () => {
  it('confere 1 goleiro e os setores de cada formação', () => {
    expect(lineupFitsFormation(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'], '2-1-1')).toBe(true);
    expect(lineupFitsFormation(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'], '2-2')).toBe(false);
    expect(lineupFitsFormation(['GOL', 'ZAG', 'MEI', 'MEI', 'ATA'], '1-2-1')).toBe(true);
    expect(lineupFitsFormation(['GOL', 'GOL', 'ZAG', 'LAT', 'ATA'], '3-1')).toBe(false);
  });
});

describe('resumo do histórico (RN17)', () => {
  it('soma compras e vendas conforme o enunciado', () => {
    const summary = summarizeTransactions([
      { type: 'VENDA', value: 4000, fee: 30, penalty: 400, profit: 300, cashChange: 3570 },
      { type: 'COMPRA', value: 3700, fee: 185, penalty: 0, profit: null, cashChange: -3885 },
    ]);
    expect(summary).toEqual({
      totalSpent: 3885,
      totalReceived: 3570,
      totalFees: 215,
      totalPenalties: 400,
      totalProfit: 300,
    });
  });
});
