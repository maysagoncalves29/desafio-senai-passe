import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ClubAvatar } from '@/components/shared/ClubAvatar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClubQuery } from '@/hooks/useClubs';
import { MAX_SQUAD_SIZE } from '@/lib/domain';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { HistoryTab } from './HistoryTab';
import { LineupTab } from './LineupTab';
import { SquadTab } from './SquadTab';

export function ClubPage() {
  const { clubId } = useParams();
  const id = Number(clubId);
  const club = useClubQuery(id);

  if (club.error) {
    return (
      <div className="grid gap-4">
        <Link
          to="/clubes"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit')}
        >
          <ArrowLeft /> Voltar para clubes
        </Link>
        <Alert variant="destructive">
          <span>{club.error.message}</span>
        </Alert>
      </div>
    );
  }

  const data = club.data;

  return (
    <div className="grid gap-5">
      <PageHeader
        title={data?.name ?? 'Clube'}
        description="Caixa, elenco com contratos, escalação e histórico de transações."
        actions={
          data && (
            <span className="flex items-center gap-2">
              <ClubAvatar id={data.id} name={data.name} className="size-8 text-sm" />
              <Badge variant="outline">Sigla {data.acronym}</Badge>
            </span>
          )
        }
      />

      <section aria-label="Resumo do clube" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Caixa" value={data ? formatMoney(data.cash) : '—'} />
        <StatCard label="Valor do elenco" value={data ? formatMoney(data.squad_value) : '—'} />
        <StatCard label="Patrimônio" value={data ? formatMoney(data.net_worth) : '—'} />
        <StatCard
          label="Elenco"
          value={data ? `${data.players.length} de ${MAX_SQUAD_SIZE}` : '—'}
          hint="Limite de 12 jogadores"
        />
      </section>

      <Tabs defaultValue="squad">
        <TabsList>
          <TabsTrigger value="squad">Elenco</TabsTrigger>
          <TabsTrigger value="lineup">Escalação</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="squad">
          <SquadTab
            club={data}
            isLoading={club.isPending}
            error={club.error}
            onRetry={() => void club.refetch()}
          />
        </TabsContent>
        <TabsContent value="lineup">
          <LineupTab club={data} clubId={id} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab clubId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
