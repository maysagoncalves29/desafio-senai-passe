import { Info, RotateCcw } from 'lucide-react';
import type { PlayerSort } from '@/api/players';
import type { Club } from '@/api/types';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox, Input, Label, Select } from '@/components/ui/form-controls';
import { CONDITIONS, CONDITION_LABELS, POSITIONS, POSITION_LABELS } from '@/lib/domain';
import { EMPTY_FILTERS, isCondition, isPosition, type PlayerFilterForm } from './player-filters';

const SORT_OPTIONS: { value: PlayerSort; label: string }[] = [
  { value: 'name', label: 'Nome (A–Z)' },
  { value: 'value_desc', label: 'Valor de mercado (maior)' },
  { value: 'value_asc', label: 'Valor de mercado (menor)' },
  { value: 'age_asc', label: 'Idade (mais novo)' },
  { value: 'age_desc', label: 'Idade (mais velho)' },
  { value: 'position', label: 'Posição (GOL → ATA)' },
];

interface PlayerFiltersBarProps {
  value: PlayerFilterForm;
  onChange: (patch: Partial<PlayerFilterForm>) => void;
  clubs: Club[];
  problems: string[];
}

export function PlayerFiltersBar({ value, onChange, clubs, problems }: PlayerFiltersBarProps) {
  const hasClub = value.clubId !== '';
  const isDefault = JSON.stringify(value) === JSON.stringify(EMPTY_FILTERS);

  return (
    <section aria-label="Filtros de jogadores" className="grid gap-3 border-b p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="filter-search">Buscar por nome</Label>
          <Input
            id="filter-search"
            type="search"
            placeholder="Ex.: joao, lua…"
            value={value.search}
            onChange={(event) => onChange({ search: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-position">Posição</Label>
          <Select
            id="filter-position"
            value={value.position}
            onChange={(event) =>
              onChange({ position: isPosition(event.target.value) ? event.target.value : '' })
            }
          >
            <option value="">Todas</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position} · {POSITION_LABELS[position]}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-condition">Condição</Label>
          <Select
            id="filter-condition"
            value={value.condition}
            onChange={(event) =>
              onChange({ condition: isCondition(event.target.value) ? event.target.value : '' })
            }
          >
            <option value="">Todas</option>
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABELS[condition]}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-club">Clube</Label>
          <Select
            id="filter-club"
            value={value.clubId}
            disabled={value.onlyFree}
            onChange={(event) => onChange({ clubId: event.target.value })}
          >
            <option value="">Todos</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="grid gap-1.5">
          <Label htmlFor="filter-min-age">Idade mínima</Label>
          <Input
            id="filter-min-age"
            type="number"
            inputMode="numeric"
            placeholder="16"
            value={value.minAge}
            onChange={(event) => onChange({ minAge: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-max-age">Idade máxima</Label>
          <Input
            id="filter-max-age"
            type="number"
            inputMode="numeric"
            placeholder="45"
            value={value.maxAge}
            onChange={(event) => onChange({ maxAge: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-min-value">Valor mínimo</Label>
          <Input
            id="filter-min-value"
            inputMode="decimal"
            placeholder="0,00"
            value={value.minValue}
            onChange={(event) => onChange({ minValue: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filter-max-value">Valor máximo</Label>
          <Input
            id="filter-max-value"
            inputMode="decimal"
            placeholder="550,00"
            value={value.maxValue}
            onChange={(event) => onChange({ maxValue: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5 lg:col-span-2">
          <Label htmlFor="filter-sort">Ordenar por</Label>
          <Select
            id="filter-sort"
            value={value.sort}
            onChange={(event) =>
              onChange({
                sort:
                  SORT_OPTIONS.find((option) => option.value === event.target.value)?.value ??
                  'name',
              })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="filter-free"
            checked={value.onlyFree}
            disabled={hasClub}
            onChange={(event) => onChange({ onlyFree: event.target.checked })}
          />
          <Label htmlFor="filter-free">Só jogadores livres</Label>
          {hasClub && (
            <span className="text-xs text-muted-foreground">
              (não combina com o filtro por clube)
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDefault}
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          <RotateCcw /> Limpar filtros
        </Button>
      </div>

      {problems.length > 0 && (
        <Alert variant="warning">
          <Info className="mt-0.5 size-4 shrink-0" />
          <ul className="grid gap-0.5">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </Alert>
      )}
    </section>
  );
}
