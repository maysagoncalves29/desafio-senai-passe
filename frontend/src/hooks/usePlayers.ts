import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  changeCondition,
  createPlayer,
  deletePlayer,
  listPlayers,
  updatePlayer,
  type PlayerEditableFields,
  type PlayerFilters,
} from '@/api/players';
import type { Condition } from '@/lib/domain';
import { useAction } from './useAction';

export function usePlayersQuery(filters: PlayerFilters, enabled = true) {
  return useQuery({
    queryKey: ['players', filters],
    queryFn: () => listPlayers(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCreatePlayer() {
  return useAction(createPlayer, {
    successMessage: (player) => `Jogador ${player.name} cadastrado.`,
  });
}

export function useUpdatePlayer() {
  return useAction(
    ({ id, ...fields }: { id: number } & PlayerEditableFields) => updatePlayer(id, fields),
    { successMessage: (player) => `Jogador ${player.name} atualizado.` },
  );
}

export function useChangeCondition() {
  return useAction(
    ({ id, condition }: { id: number; condition: Condition }) => changeCondition(id, condition),
    { successMessage: (player) => `Condição de ${player.name} atualizada.` },
  );
}

export function useDeletePlayer() {
  return useAction((id: number) => deletePlayer(id), {
    successMessage: () => 'Jogador excluído.',
  });
}
