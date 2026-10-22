import { HandCoins } from 'lucide-react';
import { useState } from 'react';
import type { ClubDetail, SquadPlayer } from '@/api/types';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDateTime, formatMoney } from '@/lib/format';
import { SellPlayerDialogs } from './SellPlayerDialogs';

interface SquadTabProps {
  club: ClubDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function SquadTab({ club, isLoading, error, onRetry }: SquadTabProps) {
  const [selling, setSelling] = useState<SquadPlayer | null>(null);

  const columns: Column<SquadPlayer>[] = [
    { header: 'Jogador', cell: (player) => <span className="font-medium">{player.name}</span> },
    { header: 'Posição', cell: (player) => <Badge variant="outline">{player.position}</Badge> },
    { header: 'Overall', className: 'text-right tabular-nums', cell: (player) => player.overall },
    { header: 'Condição', cell: (player) => <ConditionBadge condition={player.condition} /> },
    {
      header: 'Valor de mercado',
      className: 'text-right font-medium tabular-nums',
      cell: (player) => formatMoney(player.market_value),
    },
    {
      header: 'Fim da fidelidade',
      cell: (player) => (player.contract ? formatDateTime(player.contract.loyalty_until) : '—'),
    },
    {
      header: 'Dias restantes',
      className: 'text-right tabular-nums',
      cell: (player) => player.contract?.remaining_days ?? '—',
    },
    {
      header: '% de multa',
      className: 'text-right tabular-nums',
      cell: (player) => (player.contract ? `${player.contract.penalty_rate}%` : '—'),
    },
    {
      header: 'Ações',
      cell: (player) => (
        <Button variant="outline" size="sm" onClick={() => setSelling(player)}>
          <HandCoins /> Vender
        </Button>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <DataTable
        label="Elenco"
        columns={columns}
        rows={club?.players}
        getRowKey={(player) => player.id}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        emptyMessage="Este clube ainda não tem jogadores. Compre jogadores livres na tela Jogadores."
      />
      <SellPlayerDialogs player={selling} onClose={() => setSelling(null)} />
    </Card>
  );
}
