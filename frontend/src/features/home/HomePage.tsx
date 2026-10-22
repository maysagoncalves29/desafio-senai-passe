import {
  ArrowRight,
  Clock,
  History,
  ShieldHalf,
  ShoppingCart,
  Trophy,
  Users,
  Handshake,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button-variants';
import { useClubsQuery } from '@/hooks/useClubs';
import { useMatchesQuery, useStandingsQuery } from '@/hooks/useLeague';
import { usePlayersQuery } from '@/hooks/usePlayers';
import { cn } from '@/lib/utils';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Jogadores',
    description: 'Nascem livres e aptos; o valor de mercado vem da condição, agilidade e idade.',
    icon: Users,
  },
  {
    number: '02',
    title: 'Clubes',
    description: 'Começam com 300,00 em caixa e sem jogadores.',
    icon: ShieldHalf,
  },
  {
    number: '03',
    title: 'Compra',
    description: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
    icon: ShoppingCart,
  },
  {
    number: '04',
    title: 'Venda',
    description: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
    icon: Handshake,
  },
  {
    number: '05',
    title: 'Histórico',
    description: 'Toda compra e venda registrada, com totais e CSV.',
    icon: History,
  },
  {
    number: '06',
    title: 'Liga',
    description: 'Escale 5 titulares e jogue partidas que entram na classificação.',
    icon: Trophy,
  },
];

function useLeagueNumbers() {
  const players = usePlayersQuery({ sort: 'name', page: 1, limit: 1 });
  const freePlayers = usePlayersQuery({ sort: 'name', page: 1, limit: 1, free: true });
  const clubs = useClubsQuery();
  const matches = useMatchesQuery();
  const standings = useStandingsQuery();

  return {
    leader: standings.data?.find((row) => row.played > 0),
    items: [
      { label: 'jogadores', value: players.data?.meta.total_items },
      { label: 'livres', value: freePlayers.data?.meta.total_items },
      { label: 'clubes', value: clubs.data?.length },
      { label: 'partidas', value: matches.data?.length },
    ],
  };
}

export function HomePage() {
  const { items, leader } = useLeagueNumbers();

  return (
    <div className="mx-auto grid max-w-5xl gap-8 py-6 text-center">
      <div className="grid justify-items-center gap-4">
        <img src="/favicon.svg" alt="" className="size-14" />
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Liga Fictícia 2026
          {leader && ` · líder: ${leader.club_name}, ${leader.points} pontos`}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Gestão da liga, do mercado à classificação
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale
          os titulares e jogue partidas com placar calculado pelos atributos.
        </p>
        <Link to="/jogadores" className={cn(buttonVariants({ size: 'lg' }))}>
          Iniciar <ArrowRight />
        </Link>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item.label}>
              <strong className="text-foreground tabular-nums">{item.value ?? '—'}</strong>{' '}
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <ol className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number}>
            <Card className="grid h-full gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                  <step.icon className="size-4" />
                </span>
                <span className="font-mono text-xs text-muted-foreground">{step.number}</span>
              </div>
              <h2 className="text-sm font-semibold">{step.title}</h2>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </Card>
          </li>
        ))}
      </ol>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" /> Liga Fictícia 2026 · Horário de Brasília (UTC−3)
      </p>
    </div>
  );
}
