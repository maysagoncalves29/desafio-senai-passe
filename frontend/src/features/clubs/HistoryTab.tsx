import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { TransactionFilter, TransactionType } from '@/api/market';
import type { Transaction } from '@/api/types';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox, Label, Select } from '@/components/ui/form-controls';
import { useExportTransactions, useTransactionsQuery } from '@/hooks/useMarket';
import { formatDateTime, formatMoney, formatSignedMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'COMPRA', label: 'Compras' },
  { value: 'VENDA', label: 'Vendas' },
];

const columns: Column<Transaction>[] = [
  { header: 'Data e hora', cell: (transaction) => formatDateTime(transaction.created_at) },
  {
    header: 'Tipo',
    cell: (transaction) => (
      <Badge variant={transaction.type === 'COMPRA' ? 'default' : 'secondary'}>
        {transaction.type === 'COMPRA' ? 'Compra' : 'Venda'}
      </Badge>
    ),
  },
  { header: 'Jogador', cell: (transaction) => transaction.player_name },
  {
    header: 'Valor',
    className: 'text-right tabular-nums',
    cell: (transaction) => formatMoney(transaction.value),
  },
  {
    header: 'Taxa / comissão',
    className: 'text-right tabular-nums',
    cell: (transaction) => formatMoney(transaction.fee),
  },
  {
    header: 'Multa',
    className: 'text-right tabular-nums',
    cell: (transaction) => formatMoney(transaction.penalty),
  },
  {
    header: 'Lucro',
    className: 'text-right tabular-nums',
    cell: (transaction) =>
      transaction.profit === null ? '—' : formatSignedMoney(transaction.profit),
  },
  {
    header: 'Variação do caixa',
    className: 'text-right font-medium tabular-nums',
    cell: (transaction) => (
      <span className={cn(transaction.cash_change < 0 ? 'text-destructive' : 'text-success')}>
        {formatSignedMoney(transaction.cash_change)}
      </span>
    ),
  },
];

export function HistoryTab({ clubId }: { clubId: number }) {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [playerId, setPlayerId] = useState('');
  const filter: TransactionFilter = {
    types,
    ...(playerId ? { playerId: Number(playerId) } : {}),
  };

  const history = useTransactionsQuery(clubId, filter);
  const fullHistory = useTransactionsQuery(clubId, { types: [] });
  const exporter = useExportTransactions();

  const playersInHistory = useMemo(() => {
    const names = new Map<number, string>();
    fullHistory.data?.data.forEach((transaction) =>
      names.set(transaction.player_id, transaction.player_name),
    );
    return [...names.entries()].sort((first, second) => first[1].localeCompare(second[1], 'pt-BR'));
  }, [fullHistory.data]);

  function toggleType(type: TransactionType, checked: boolean) {
    setTypes((current) => (checked ? [...current, type] : current.filter((item) => item !== type)));
  }

  const summary = history.data?.summary;

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b p-4">
          <div className="flex flex-wrap items-end gap-4">
            <fieldset className="grid gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">Tipo</legend>
              <div className="flex items-center gap-4">
                {TYPE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`history-type-${option.value}`}
                      checked={types.includes(option.value)}
                      onChange={(event) => toggleType(option.value, event.target.checked)}
                    />
                    <Label htmlFor={`history-type-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-1.5">
              <Label htmlFor="history-player">Jogador</Label>
              <Select
                id="history-player"
                className="min-w-52"
                value={playerId}
                onChange={(event) => setPlayerId(event.target.value)}
              >
                <option value="">Todos os jogadores</option>
                {playersInHistory.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            disabled={exporter.isPending}
            onClick={() => void exporter.run({ clubId, filter })}
          >
            <Download /> {exporter.isPending ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </div>
        <DataTable
          label="Histórico de transações"
          columns={columns}
          rows={history.data?.data}
          getRowKey={(transaction) => transaction.id}
          isLoading={history.isPending}
          error={history.error}
          onRetry={() => void history.refetch()}
          emptyMessage="Nenhuma transação encontrada para esses filtros."
        />
      </Card>

      {summary && (
        <section
          aria-label="Totais do histórico"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <StatCard label="Total pago em compras" value={formatMoney(summary.total_spent)} />
          <StatCard label="Total recebido em vendas" value={formatMoney(summary.total_received)} />
          <StatCard label="Taxas e comissões" value={formatMoney(summary.total_fees)} />
          <StatCard label="Multas" value={formatMoney(summary.total_penalties)} />
          <StatCard label="Lucro total" value={formatSignedMoney(summary.total_profit)} />
        </section>
      )}
    </div>
  );
}
