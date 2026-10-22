import { Pencil, Plus, ShoppingCart, Stethoscope, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import type { Player } from '@/api/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useClubsQuery } from '@/hooks/useClubs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDeletePlayer, usePlayersQuery } from '@/hooks/usePlayers';
import { formatMoney } from '@/lib/format';
import { BuyPlayerDialog } from './BuyPlayerDialog';
import { ConditionDialog } from './ConditionDialog';
import { CreatePlayerDialog } from './CreatePlayerDialog';
import { EditPlayerDialog } from './EditPlayerDialog';
import { PlayerFiltersBar } from './PlayerFiltersBar';
import {
  EMPTY_FILTERS,
  PLAYERS_PER_PAGE,
  buildPlayerFilters,
  type PlayerFilterForm,
} from './player-filters';

export function PlayersPage() {
  const [form, setForm] = useState<PlayerFilterForm>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [changingCondition, setChangingCondition] = useState<Player | null>(null);
  const [buying, setBuying] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);

  const debouncedForm = useDebouncedValue(form);
  const { filters, problems } = useMemo(
    () => buildPlayerFilters(debouncedForm, page),
    [debouncedForm, page],
  );
  const players = usePlayersQuery(filters, problems.length === 0);
  const clubs = useClubsQuery();
  const deletion = useDeletePlayer();

  const clubsById = useMemo(
    () => new Map(clubs.data?.map((club) => [club.id, club])),
    [clubs.data],
  );

  function updateFilters(patch: Partial<PlayerFilterForm>) {
    setForm((current) => {
      const next = { ...current, ...patch };
      if (next.onlyFree) next.clubId = '';
      return next;
    });
    setPage(1);
  }

  async function confirmDeletion() {
    if (!deleting) return;
    await deletion.run(deleting.id);
    setDeleting(null);
  }

  const columns: Column<Player>[] = [
    { header: 'Jogador', cell: (player) => <span className="font-medium">{player.name}</span> },
    {
      header: 'Posição',
      cell: (player) => <Badge variant="outline">{player.position}</Badge>,
    },
    { header: 'Overall', className: 'text-right tabular-nums', cell: (player) => player.overall },
    { header: 'Agilidade', className: 'text-right tabular-nums', cell: (player) => player.agility },
    { header: 'Idade', className: 'text-right tabular-nums', cell: (player) => player.age },
    { header: 'Condição', cell: (player) => <ConditionBadge condition={player.condition} /> },
    {
      header: 'Valor base',
      className: 'text-right tabular-nums',
      cell: (player) => formatMoney(player.base_value),
    },
    {
      header: 'Valor de mercado',
      className: 'text-right font-medium tabular-nums',
      cell: (player) => formatMoney(player.market_value),
    },
    {
      header: 'Clube',
      cell: (player) => {
        if (player.club_id === null) return <Badge variant="secondary">Livre</Badge>;
        const club = clubsById.get(player.club_id);
        return (
          <Link className="text-primary hover:underline" to={`/clubes/${player.club_id}`}>
            {club?.acronym ?? `#${player.club_id}`}
          </Link>
        );
      },
    },
    {
      header: 'Ações',
      cell: (player) => (
        <div className="flex items-center gap-1">
          {player.club_id === null && (
            <Button size="sm" onClick={() => setBuying(player)}>
              <ShoppingCart /> Comprar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Editar ${player.name}`}
            title="Editar"
            onClick={() => setEditing(player)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Alterar condição de ${player.name}`}
            title="Alterar condição física"
            onClick={() => setChangingCondition(player)}
          >
            <Stethoscope />
          </Button>
          {player.club_id === null && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(player)}
            >
              <Trash2 /> Excluir
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader
        title="Jogadores"
        description="Cadastro, condição física, valor de mercado e compra de jogadores livres."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Novo jogador
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <PlayerFiltersBar
          value={form}
          onChange={updateFilters}
          clubs={clubs.data ?? []}
          problems={problems}
        />
        <DataTable
          label="Jogadores"
          columns={columns}
          rows={players.data?.data}
          getRowKey={(player) => player.id}
          isLoading={players.isPending && problems.length === 0}
          error={players.error}
          onRetry={() => void players.refetch()}
          emptyMessage="Nenhum jogador encontrado para esses filtros."
        />
        {players.data && (
          <Pagination
            page={players.data.meta.page}
            limit={PLAYERS_PER_PAGE}
            totalItems={players.data.meta.total_items}
            totalPages={players.data.meta.total_pages}
            itemLabel="jogador"
            onPageChange={setPage}
          />
        )}
      </Card>

      <CreatePlayerDialog open={creating} onOpenChange={setCreating} />
      <EditPlayerDialog player={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <ConditionDialog
        player={changingCondition}
        onOpenChange={(open) => !open && setChangingCondition(null)}
      />
      <BuyPlayerDialog player={buying} onOpenChange={(open) => !open && setBuying(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir jogador?"
        description={`${deleting?.name ?? 'O jogador'} sairá da lista de jogadores. As transações e partidas antigas continuam no histórico.`}
        confirmLabel="Excluir"
        destructive
        isPending={deletion.isPending}
        onConfirm={() => void confirmDeletion()}
      />
    </div>
  );
}
