import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@/components/shared/PageHeader';
import { Alert, Skeleton } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button-variants';
import { useMatchQuery } from '@/hooks/useLeague';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MatchResultPanel } from './MatchResultPanel';

export function MatchDetailPage() {
  const { matchId } = useParams();
  const match = useMatchQuery(Number(matchId));

  return (
    <div className="grid grid-cols-1 gap-4">
      <Link
        to="/partidas"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-fit')}
      >
        <ArrowLeft /> Voltar para partidas
      </Link>
      {match.error && <Alert variant="destructive">{match.error.message}</Alert>}
      {match.isPending && <Skeleton className="h-48 w-full" />}
      {match.data && (
        <>
          <PageHeader
            title={`Partida ${match.data.home.club_name} × ${match.data.away.club_name}`}
            description={`Jogada em ${formatDateTime(match.data.played_at)} (horário de Brasília).`}
          />
          <MatchResultPanel match={match.data} />
        </>
      )}
    </div>
  );
}
