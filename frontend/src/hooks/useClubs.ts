import { useQuery } from '@tanstack/react-query';
import { createClub, getClub, listClubs, type ClubSort } from '@/api/clubs';
import { useAction } from './useAction';

export function useClubsQuery(sort: ClubSort = 'name') {
  return useQuery({ queryKey: ['clubs', sort], queryFn: () => listClubs(sort) });
}

export function useClubQuery(id: number) {
  return useQuery({ queryKey: ['club', id], queryFn: () => getClub(id) });
}

export function useCreateClub() {
  return useAction(createClub, { successMessage: (club) => `Clube ${club.name} criado.` });
}
