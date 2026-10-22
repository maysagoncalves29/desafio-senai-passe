import { download, request, type DownloadedFile } from './http';
import type { PurchaseResult, SaleResult, TransactionHistory } from './types';

export type TransactionType = 'COMPRA' | 'VENDA';

export interface PurchaseInput {
  clubId: number;
  loyaltyUntil: string;
}

export interface TransactionFilter {
  types: TransactionType[];
  playerId?: number;
}

function toQuery(filter: TransactionFilter) {
  return {
    type: filter.types.length > 0 ? filter.types.join(',') : undefined,
    player_id: filter.playerId,
  };
}

export function buyPlayer(playerId: number, input: PurchaseInput): Promise<PurchaseResult> {
  return request<PurchaseResult>(`/players/${playerId}/buy`, {
    method: 'POST',
    body: { club_id: input.clubId, loyalty_until: input.loyaltyUntil },
  });
}

export function sellPlayer(playerId: number): Promise<SaleResult> {
  return request<SaleResult>(`/players/${playerId}/sell`, { method: 'POST' });
}

export function listTransactions(
  clubId: number,
  filter: TransactionFilter,
): Promise<TransactionHistory> {
  return request<TransactionHistory>(`/clubs/${clubId}/transactions`, { query: toQuery(filter) });
}

export function exportTransactions(
  clubId: number,
  filter: TransactionFilter,
): Promise<DownloadedFile> {
  return download(`/clubs/${clubId}/transactions/export`, toQuery(filter));
}
