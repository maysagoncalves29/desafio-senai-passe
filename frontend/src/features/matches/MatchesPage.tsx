import { useState } from 'react';
import { Link } from 'react-router';
import type { Match, MatchDetail } from '@/api/types';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/form-controls';
import { useClubsQuery } from '@/hooks/useClubs';
import { useMatchesQuery } from '@/hooks/useLeague';
import { formatDateTime } from '@/lib/format';
import { MatchResultPanel } from './MatchResultPanel';
import { PlayMatchCard } from './PlayMatchCard';

const columns: Column<Match>[] = [
  { header: 'Data e hora', cell: (match) => formatDateTime(match.played_at) },
  { header: 'Mandante', cell: (match) => match.home.club_name },
  {
    header: 'Placar',
    className: 'text-center font-semibold tabular-nums',
    cell: (match) => `${match.home.goals} × ${match.away.goals}`,
  },
  { header: 'Visitante', cell: (match) => match.away.club_name },
  {
    header: 'Duelos',
    cell: (match) => (
      <Link className="text-primary hover:underline" to={`/partidas/${match.id}`}>
        Ver duelos
      </Link>
    ),
  },
];

export function MatchesPage() {
  const [clubFilter, setClubFilter] = useState('');
  const [lastMatch, setLastMatch] = useState<MatchDetail | null>(null);
  const clubs = useClubsQuery();
  const matches = useMatchesQuery(clubFilter === '' ? undefined : Number(clubFilter));

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader
        title="Partidas"
        description="Escolha dois clubes com escalação completa. O placar sai de 6 duelos entre os titulares, sem sorteio."
      />
      <PlayMatchCard onPlayed={setLastMatch} />
      {lastMatch && <MatchResultPanel match={lastMatch} />}

      <h2 className="mt-2 text-base font-semibold">Histórico de partidas</h2>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Label htmlFor="matches-club">Filtrar por clube</Label>
          <Select
            id="matches-club"
            className="w-auto min-w-52"
            value={clubFilter}
            onChange={(event) => setClubFilter(event.target.value)}
          >
            <option value="">Todos os clubes</option>
            {clubs.data?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </Select>
        </div>
        <DataTable
          label="Histórico de partidas"
          columns={columns}
          rows={matches.data}
          getRowKey={(match) => match.id}
          isLoading={matches.isPending}
          error={matches.error}
          onRetry={() => void matches.refetch()}
          emptyMessage="Nenhuma partida jogada ainda."
        />
      </Card>
    </div>
  );
}
