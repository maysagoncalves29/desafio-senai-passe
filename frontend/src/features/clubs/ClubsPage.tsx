import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { ClubSort } from '@/api/clubs';
import type { Club } from '@/api/types';
import { ClubAvatar } from '@/components/shared/ClubAvatar';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/form-controls';
import { useClubsQuery } from '@/hooks/useClubs';
import { formatMoney } from '@/lib/format';
import { CreateClubDialog } from './CreateClubDialog';

const SORT_OPTIONS: { value: ClubSort; label: string }[] = [
  { value: 'name', label: 'Nome (A–Z)' },
  { value: 'net_worth_desc', label: 'Patrimônio (maior → menor)' },
  { value: 'net_worth_asc', label: 'Patrimônio (menor → maior)' },
];

const columns: Column<Club>[] = [
  {
    header: 'Clube',
    cell: (club) => (
      <Link
        className="flex items-center gap-2 font-medium hover:underline"
        to={`/clubes/${club.id}`}
      >
        <ClubAvatar id={club.id} name={club.name} />
        {club.name}
      </Link>
    ),
  },
  { header: 'Sigla', cell: (club) => club.acronym },
  { header: 'Caixa', className: 'text-right tabular-nums', cell: (club) => formatMoney(club.cash) },
  {
    header: 'Valor do elenco',
    className: 'text-right tabular-nums',
    cell: (club) => formatMoney(club.squad_value),
  },
  {
    header: 'Patrimônio',
    className: 'text-right font-medium tabular-nums',
    cell: (club) => formatMoney(club.net_worth),
  },
];

export function ClubsPage() {
  const [sort, setSort] = useState<ClubSort>('name');
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(searchParams.has('novo'));
  const clubs = useClubsQuery(sort);

  function changeCreating(open: boolean) {
    setCreating(open);
    if (!open && searchParams.has('novo')) setSearchParams({}, { replace: true });
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <PageHeader
        title="Clubes"
        description="Caixa, valor do elenco e patrimônio de cada clube da liga."
        actions={
          <Button onClick={() => changeCreating(true)}>
            <Plus /> Novo clube
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Label htmlFor="club-sort">Ordenar por</Label>
          <Select
            id="club-sort"
            className="w-auto min-w-56"
            value={sort}
            onChange={(event) =>
              setSort(
                SORT_OPTIONS.find((option) => option.value === event.target.value)?.value ?? 'name',
              )
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <DataTable
          label="Clubes"
          columns={columns}
          rows={clubs.data}
          getRowKey={(club) => club.id}
          isLoading={clubs.isPending}
          error={clubs.error}
          onRetry={() => void clubs.refetch()}
          emptyMessage="Nenhum clube cadastrado ainda. Crie o primeiro clube da liga."
        />
      </Card>
      <CreateClubDialog open={creating} onOpenChange={changeCreating} />
    </div>
  );
}
