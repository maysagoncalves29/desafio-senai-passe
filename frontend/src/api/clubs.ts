import { request } from './http';
import type { Club, ClubDetail } from './types';

export type ClubSort = 'name' | 'net_worth_asc' | 'net_worth_desc';

export interface CreateClubInput {
  name: string;
  acronym: string;
}

export function listClubs(sort: ClubSort): Promise<Club[]> {
  return request<Club[]>('/clubs', { query: { sort } });
}

export function getClub(id: number): Promise<ClubDetail> {
  return request<ClubDetail>(`/clubs/${id}`);
}

export function createClub(input: CreateClubInput): Promise<Club> {
  return request<Club>('/clubs', { method: 'POST', body: input });
}
