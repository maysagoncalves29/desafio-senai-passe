import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import type { ClubDetail, Lineup } from '@/api/types';
import { ConditionBadge } from '@/components/shared/ConditionBadge';
import { FormField } from '@/components/shared/FormField';
import { Alert, Skeleton } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/form-controls';
import { useLineupQuery, useSaveLineup } from '@/hooks/useLeague';
import { FORMATIONS, lineupSlots, type Formation } from '@/lib/domain';
import { cn } from '@/lib/utils';
import { lineupSchema, type LineupForm } from './club-form.schemas';
import { assignSlots, eligiblePlayers, slotLabels } from './lineup-slots';

const DEFAULT_FORMATION: Formation = '2-1-1';

function LineupEditor({ club, lineup }: { club: ClubDetail; lineup: Lineup }) {
  const { run, isPending } = useSaveLineup();
  const initialFormation = lineup.formation ?? DEFAULT_FORMATION;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<LineupForm>({
    resolver: zodResolver(lineupSchema),
    defaultValues: {
      formation: initialFormation,
      slots: assignSlots(initialFormation, lineup.players),
    },
  });

  const formation = useWatch({ control, name: 'formation' });
  const slotValues = useWatch({ control, name: 'slots' });
  const sectors = lineupSlots(formation);
  const labels = slotLabels(sectors);

  function changeFormation(next: Formation) {
    const chosenPlayers = club.players.filter((player) => slotValues.includes(String(player.id)));
    setValue('formation', next, { shouldValidate: true });
    setValue('slots', assignSlots(next, chosenPlayers), { shouldValidate: false });
  }

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        await run({
          clubId: club.id,
          formation: values.formation,
          playerIds: values.slots.map(Number),
        });
      })}
    >
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">
          Formação (jogadores de linha, sem o goleiro)
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FORMATIONS.map((option) => (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-soft-foreground',
              )}
            >
              <input
                type="radio"
                value={option}
                checked={formation === option}
                onChange={() => changeFormation(option)}
                className="accent-primary"
              />
              {option}
            </label>
          ))}
        </div>
        {errors.formation && (
          <p role="alert" className="text-xs text-destructive">
            {errors.formation.message}
          </p>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector, index) => {
          const takenElsewhere = slotValues.filter((_, other) => other !== index);
          const options = eligiblePlayers(club.players, sector, takenElsewhere);
          const slotId = `lineup-slot-${index}`;
          return (
            <FormField
              key={slotId}
              label={labels[index] ?? ''}
              htmlFor={slotId}
              error={errors.slots?.[index]?.message}
            >
              <Select
                id={slotId}
                aria-invalid={Boolean(errors.slots?.[index])}
                {...register(`slots.${index}`)}
              >
                <option value="">Selecione o titular…</option>
                {options.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name} · {player.position} · OVR {player.overall}
                    {player.condition === 'MAL_CONDICIONADO' ? ' · mal condicionado' : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          );
        })}
      </div>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar escalação'}
        </Button>
      </div>
    </form>
  );
}

function SavedLineup({ lineup }: { lineup: Lineup }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Escalação salva</CardTitle>
        <Badge variant={lineup.complete ? 'success' : 'warning'}>
          {lineup.formation ? `Formação ${lineup.formation}` : 'Sem formação'}
        </Badge>
      </CardHeader>
      <CardContent>
        {lineup.players.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum titular escalado.</p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {lineup.players.map((player) => (
              <li key={player.id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{player.position}</Badge>
                  {player.name}
                </span>
                <ConditionBadge condition={player.condition} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface LineupTabProps {
  club: ClubDetail | undefined;
  clubId: number;
}

export function LineupTab({ club, clubId }: LineupTabProps) {
  const lineup = useLineupQuery(clubId);

  if (lineup.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
          <span>{lineup.error.message}</span>
          <Button variant="outline" size="sm" onClick={() => void lineup.refetch()}>
            Tentar novamente
          </Button>
        </div>
      </Alert>
    );
  }

  if (!lineup.data || !club) {
    return (
      <div className="grid gap-3" aria-busy="true">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (club.players.length === 0) {
    return (
      <Alert variant="info">
        Este clube ainda não tem jogadores para escalar. Compre jogadores livres primeiro.
      </Alert>
    );
  }

  const editorKey = `${lineup.data.formation}-${lineup.data.players.map((player) => player.id).join(',')}`;

  return (
    <div className="grid gap-4">
      {!lineup.data.complete && (
        <Alert variant="warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Escalação incompleta: o clube não pode jogar partidas até escalar os 5 titulares (1
            goleiro e 4 jogadores de linha).
          </span>
        </Alert>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="p-4">
          <LineupEditor key={editorKey} club={club} lineup={lineup.data} />
        </Card>
        <SavedLineup lineup={lineup.data} />
      </div>
    </div>
  );
}
