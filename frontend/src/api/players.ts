import type { Condition, Position } from '@/lib/domain';
import { request } from './http';
import type { Player, PlayerPage } from './types';

export type PlayerSort = 'name' | 'value_asc' | 'value_desc' | 'age_asc' | 'age_desc' | 'position';

export interface PlayerFilters {
  search?: string;
  position?: Position;
  condition?: Condition;
  free?: boolean;
  clubId?: number;
  minAge?: number;
  maxAge?: number;
  minValue?: number;
  maxValue?: number;
  sort: PlayerSort;
  page: number;
  limit: number;
}

export interface PlayerEditableFields {
  name: string;
  position: Position;
  agility: number;
  age: number;
}

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
}

export type CreatePlayerInput = PlayerEditableFields & PlayerAttributes;

export function listPlayers(filters: PlayerFilters): Promise<PlayerPage> {
  return request<PlayerPage>('/players', {
    query: {
      search: filters.search,
      position: filters.position,
      condition: filters.condition,
      free: filters.free,
      club_id: filters.clubId,
      min_age: filters.minAge,
      max_age: filters.maxAge,
      min_value: filters.minValue,
      max_value: filters.maxValue,
      sort: filters.sort,
      page: filters.page,
      limit: filters.limit,
    },
  });
}

export function createPlayer(input: CreatePlayerInput): Promise<Player> {
  return request<Player>('/players', { method: 'POST', body: input });
}

export function updatePlayer(id: number, input: PlayerEditableFields): Promise<Player> {
  return request<Player>(`/players/${id}`, { method: 'PUT', body: input });
}

export function changeCondition(id: number, condition: Condition): Promise<Player> {
  return request<Player>(`/players/${id}/condition`, { method: 'PATCH', body: { condition } });
}

export function deletePlayer(id: number): Promise<void> {
  return request<void>(`/players/${id}`, { method: 'DELETE' });
}
