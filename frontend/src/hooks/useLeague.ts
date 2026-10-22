import { useQuery } from '@tanstack/react-query';
import {
  getLineup,
  getMatch,
  getStandings,
  listMatches,
  playMatch,
  saveLineup,
} from '@/api/league';
import type { Formation } from '@/lib/domain';
import { useAction } from './useAction';

export function useLineupQuery(clubId: number) {
  return useQuery({ queryKey: ['lineup', clubId], queryFn: () => getLineup(clubId) });
}

export function useSaveLineup() {
  return useAction(
    ({ clubId, ...input }: { clubId: number; formation: Formation; playerIds: number[] }) =>
      saveLineup(clubId, input),
    { successMessage: () => 'Escalação salva.' },
  );
}

export function useMatchesQuery(clubId?: number) {
  return useQuery({ queryKey: ['matches', clubId ?? 'all'], queryFn: () => listMatches(clubId) });
}

export function useMatchQuery(id: number) {
  return useQuery({ queryKey: ['match', id], queryFn: () => getMatch(id) });
}

export function usePlayMatch() {
  return useAction(playMatch, {
    successMessage: (match) =>
      `Partida jogada: ${match.home.club_name} ${match.home.goals} x ${match.away.goals} ${match.away.club_name}.`,
  });
}

export function useStandingsQuery() {
  return useQuery({ queryKey: ['standings'], queryFn: getStandings });
}
