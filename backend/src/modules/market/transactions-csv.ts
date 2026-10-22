import type { ClubTransaction } from '@prisma/client';
import { formatBrasiliaDateTime } from '../../domain/brasilia-time.js';
import { toCents } from '../../domain/money.js';
import { formatMoney } from '../../shared/format.js';

const CSV_HEADER = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

function escapeField(text: string): string {
  return /[;"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toRow(transaction: ClubTransaction): string {
  return [
    formatBrasiliaDateTime(transaction.createdAt),
    transaction.type,
    escapeField(transaction.playerName),
    formatMoney(toCents(transaction.value)),
    formatMoney(toCents(transaction.fee)),
    formatMoney(toCents(transaction.penalty)),
    transaction.profit === null ? '' : formatMoney(toCents(transaction.profit)),
    formatMoney(toCents(transaction.cashChange)),
  ].join(';');
}

export function buildTransactionsCsv(transactions: ClubTransaction[]): string {
  return [CSV_HEADER, ...transactions.map(toRow)].map((line) => `${line}\n`).join('');
}
