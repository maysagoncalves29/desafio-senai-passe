import { BarChart3, Home, Plus, Swords, Trophy, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link, NavLink } from 'react-router';
import { ClubAvatar } from '@/components/shared/ClubAvatar';
import { useClubsQuery } from '@/hooks/useClubs';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const MARKET_ITEMS: NavItem[] = [
  { to: '/jogadores', label: 'Jogadores', icon: Users },
  { to: '/clubes', label: 'Clubes', icon: BarChart3 },
];

const LEAGUE_ITEMS: NavItem[] = [
  { to: '/partidas', label: 'Partidas', icon: Swords },
  { to: '/classificacao', label: 'Classificação', icon: Trophy },
];

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent',
    isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
  );

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <div className="grid gap-1">
      <p className="px-2 text-xs font-medium text-muted-foreground">{title}</p>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={linkClasses} onClick={onNavigate}>
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const clubs = useClubsQuery();

  return (
    <nav aria-label="Navegação principal" className="flex h-full flex-col gap-5 p-3">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-2 py-1">
        <img src="/favicon.svg" alt="" className="size-8" />
        <span className="grid leading-tight">
          <span className="text-base font-semibold">Passe</span>
          <span className="text-xs text-muted-foreground">Gestão da liga</span>
        </span>
      </Link>

      <NavLink to="/" end className={linkClasses} onClick={onNavigate}>
        <Home className="size-4" />
        Início
      </NavLink>
      <NavSection title="Mercado" items={MARKET_ITEMS} onNavigate={onNavigate} />
      <NavSection title="Liga" items={LEAGUE_ITEMS} onNavigate={onNavigate} />

      <div className="grid gap-1">
        <div className="flex items-center justify-between px-2">
          <p className="text-xs font-medium text-muted-foreground">Clubes</p>
          <Link
            to="/clubes?novo=1"
            onClick={onNavigate}
            aria-label="Novo clube"
            className="rounded-md p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <Plus className="size-4" />
          </Link>
        </div>
        {clubs.data?.map((club) => (
          <NavLink
            key={club.id}
            to={`/clubes/${club.id}`}
            className={linkClasses}
            onClick={onNavigate}
          >
            <ClubAvatar id={club.id} name={club.name} className="size-5 text-[10px]" />
            <span className="truncate">{club.name}</span>
          </NavLink>
        ))}
        {clubs.isPending && (
          <p className="px-2 text-xs text-muted-foreground">Carregando clubes…</p>
        )}
        {clubs.isError && (
          <p className="px-2 text-xs text-destructive">Não foi possível listar os clubes.</p>
        )}
      </div>
    </nav>
  );
}
