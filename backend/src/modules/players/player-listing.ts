import type { Player } from '@prisma/client';
import type { Cents } from '../../domain/money.js';
import { compareByNameThenId, compareNames, normalizeForSearch } from '../../domain/text.js';
import { POSITIONS } from '../../domain/types.js';
import { marketValueOf } from './player.calculations.js';
import type { PlayerListQuery, PlayerSort } from './player.schemas.js';

interface ListedPlayer {
  record: Player;
  marketValue: Cents;
}

type Comparator = (first: ListedPlayer, second: ListedPlayer) => number;

const COMPARATORS: Record<PlayerSort, Comparator> = {
  name: (first, second) => compareNames(first.record.name, second.record.name),
  value_asc: (first, second) => first.marketValue - second.marketValue,
  value_desc: (first, second) => second.marketValue - first.marketValue,
  age_asc: (first, second) => first.record.age - second.record.age,
  age_desc: (first, second) => second.record.age - first.record.age,
  position: (first, second) =>
    POSITIONS.indexOf(first.record.position as (typeof POSITIONS)[number]) -
    POSITIONS.indexOf(second.record.position as (typeof POSITIONS)[number]),
};

function isInValueRange(player: ListedPlayer, query: PlayerListQuery): boolean {
  const { minValueCents, maxValueCents } = query;
  return (
    (minValueCents === undefined || player.marketValue >= minValueCents) &&
    (maxValueCents === undefined || player.marketValue <= maxValueCents)
  );
}

function matchesSearch(player: ListedPlayer, search: string | undefined): boolean {
  return search === undefined || normalizeForSearch(player.record.name).includes(search);
}

function compareBySort(sort: PlayerSort[]): (first: ListedPlayer, second: ListedPlayer) => number {
  return (first, second) => {
    for (const criterion of sort) {
      const difference = COMPARATORS[criterion](first, second);
      if (difference !== 0) return difference;
    }
    return compareByNameThenId(first.record, second.record);
  };
}

export interface PlayerPage {
  players: Player[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

// Busca, filtros de valor, ordenação e só depois a paginação (RN07), sobre o valor de mercado calculado.
export function listPlayers(records: Player[], query: PlayerListQuery): PlayerPage {
  const matching = records
    .map((record) => ({ record, marketValue: marketValueOf(record) }))
    .filter((player) => matchesSearch(player, query.search) && isInValueRange(player, query))
    .sort(compareBySort(query.sort));

  const start = (query.page - 1) * query.limit;
  return {
    players: matching.slice(start, start + query.limit).map(({ record }) => record),
    page: query.page,
    limit: query.limit,
    totalItems: matching.length,
    totalPages: Math.ceil(matching.length / query.limit),
  };
}
