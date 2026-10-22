import { Link } from 'react-router';
import type { Standing } from '@/api/types';
import { ClubAvatar } from '@/components/shared/ClubAvatar';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { useStandingsQuery } from '@/hooks/useLeague';

const numeric = 'text-right tabular-nums';

function formatGoalDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

const columns: Column<Standing>[] = [
  { header: 'Pos.', className: numeric, cell: (row) => row.position },
  {
    header: 'Clube',
    cell: (row) => (
      <Link
        className="flex items-center gap-2 font-medium hover:underline"
        to={`/clubes/${row.club_id}`}
      >
        <ClubAvatar id={row.club_id} name={row.club_name} />
        {row.club_name}
      </Link>
    ),
  },
  { header: 'J', className: numeric, cell: (row) => row.played },
  { header: 'V', className: numeric, cell: (row) => row.wins },
  { header: 'E', className: numeric, cell: (row) => row.draws },
  { header: 'D', className: numeric, cell: (row) => row.losses },
  { header: 'GM', className: numeric, cell: (row) => row.goals_for },
  { header: 'GS', className: numeric, cell: (row) => row.goals_against },
  { header: 'SG', className: numeric, cell: (row) => formatGoalDifference(row.goal_difference) },
  { header: 'Pts', className: `${numeric} font-semibold`, cell: (row) => row.points },
];

export function StandingsPage() {
  const standings = useStandingsQuery();

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Classificação"
        description="Pontos (vitória 3, empate 1), saldo de gols, gols marcados e nome do clube, nessa ordem de desempate."
      />
      <Card className="overflow-hidden">
        <DataTable
          label="Classificação"
          columns={columns}
          rows={standings.data}
          getRowKey={(row) => row.club_id}
          isLoading={standings.isPending}
          error={standings.error}
          onRetry={() => void standings.refetch()}
          emptyMessage="Nenhum clube cadastrado ainda."
        />
        <p className="border-t p-3 text-xs text-muted-foreground">
          J: jogos · V: vitórias · E: empates · D: derrotas · GM: gols marcados · GS: gols sofridos
          · SG: saldo de gols · Pts: pontos
        </p>
      </Card>
    </div>
  );
}
