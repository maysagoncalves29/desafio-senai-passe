import type { Duel, MatchDetail } from '@/api/types';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const ATTRIBUTE_LABELS: Record<Duel['attacker']['attribute'], string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
};

const RESULT_LABELS: Record<MatchDetail['result'], string> = {
  MANDANTE: 'Vitória do mandante',
  VISITANTE: 'Vitória do visitante',
  EMPATE: 'Empate',
};

function DuelPlayer({ participant }: { participant: Duel['attacker'] }) {
  return (
    <div className="grid gap-0.5">
      <span className="flex items-center gap-1.5 font-medium">
        {participant.player_name}
        <Badge variant="outline">{participant.position}</Badge>
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ConditionBadge condition={participant.condition} />
        {ATTRIBUTE_LABELS[participant.attribute]} {participant.value}
      </span>
    </div>
  );
}

function buildColumns(match: MatchDetail): Column<Duel>[] {
  const clubNames = new Map([
    [match.home.club_id, match.home.club_name],
    [match.away.club_id, match.away.club_name],
  ]);

  return [
    { header: 'Duelo', className: 'tabular-nums', cell: (duel) => duel.order },
    { header: 'Ataca', cell: (duel) => clubNames.get(duel.attacking_club_id) ?? '—' },
    { header: 'Atacante', cell: (duel) => <DuelPlayer participant={duel.attacker} /> },
    { header: 'Defensor', cell: (duel) => <DuelPlayer participant={duel.defender} /> },
    {
      header: 'Ataque × defesa',
      className: 'text-center tabular-nums',
      cell: (duel) => `${duel.attacker.value} × ${duel.defender.value}`,
    },
    {
      header: 'Gol',
      cell: (duel) =>
        duel.goal ? (
          <Badge variant="success">Gol</Badge>
        ) : (
          <Badge variant="secondary">Sem gol</Badge>
        ),
    },
  ];
}

export function MatchResultPanel({ match }: { match: MatchDetail }) {
  return (
    <Card className="overflow-hidden" aria-label="Resultado da partida">
      <div className="grid gap-1 border-b p-4 text-center">
        <p className="text-xs text-muted-foreground">{RESULT_LABELS[match.result]}</p>
        <p className="flex flex-wrap items-center justify-center gap-3 text-lg font-semibold">
          <span>{match.home.club_name}</span>
          <span className="rounded-md bg-muted px-3 py-1 tabular-nums">
            {match.home.goals} × {match.away.goals}
          </span>
          <span>{match.away.club_name}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Formações: {match.home.formation} (mandante) e {match.away.formation} (visitante)
        </p>
      </div>
      <DataTable
        label="Duelos da partida"
        columns={buildColumns(match)}
        rows={match.duels}
        getRowKey={(duel) => duel.order}
        isLoading={false}
        error={null}
        onRetry={() => undefined}
        emptyMessage="Nenhum duelo registrado."
      />
    </Card>
  );
}
