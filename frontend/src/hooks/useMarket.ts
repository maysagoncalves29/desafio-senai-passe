import { useQuery } from '@tanstack/react-query';
import {
  buyPlayer,
  exportTransactions,
  listTransactions,
  sellPlayer,
  type PurchaseInput,
  type TransactionFilter,
} from '@/api/market';
import { useAction } from './useAction';

export function useBuyPlayer() {
  return useAction(
    ({ playerId, ...input }: { playerId: number } & PurchaseInput) => buyPlayer(playerId, input),
    { successMessage: (purchase) => `${purchase.player_name} contratado com sucesso.` },
  );
}

export function useSellPlayer() {
  return useAction((playerId: number) => sellPlayer(playerId), {
    successMessage: (sale) => `${sale.player_name} vendido com sucesso.`,
  });
}

export function useTransactionsQuery(clubId: number, filter: TransactionFilter) {
  return useQuery({
    queryKey: ['transactions', clubId, filter],
    queryFn: () => listTransactions(clubId, filter),
  });
}

function saveFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useExportTransactions() {
  return useAction(
    async ({ clubId, filter }: { clubId: number; filter: TransactionFilter }) => {
      const file = await exportTransactions(clubId, filter);
      saveFile(file.blob, file.filename);
      return file;
    },
    { successMessage: (file) => `Arquivo ${file.filename} baixado.` },
  );
}
