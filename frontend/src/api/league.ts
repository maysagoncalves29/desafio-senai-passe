import type { Formation } from '@/lib/domain';
import { request } from './http';
import type { Lineup, Match, MatchDetail, Standing } from './types';

export function getLineup(clubId: number): Promise<Lineup> {
  return request<Lineup>(`/clubs/${clubId}/lineup`);
}

export function saveLineup(
  clubId: number,
  input: { formation: Formation; playerIds: number[] },
): Promise<Lineup> {
  return request<Lineup>(`/clubs/${clubId}/lineup`, {
    method: 'PUT',
    body: { formation: input.formation, player_ids: input.playerIds },
  });
}

export function playMatch(input: { homeClubId: number; awayClubId: number }): Promise<MatchDetail> {
  return request<MatchDetail>('/matches', {
    method: 'POST',
    body: { home_club_id: input.homeClubId, away_club_id: input.awayClubId },
  });
}

export function listMatches(clubId?: number): Promise<Match[]> {
  return request<Match[]>('/matches', { query: { club_id: clubId } });
}

export function getMatch(id: number): Promise<MatchDetail> {
  return request<MatchDetail>(`/matches/${id}`);
}

export function getStandings(): Promise<Standing[]> {
  return request<Standing[]>('/standings');
}
