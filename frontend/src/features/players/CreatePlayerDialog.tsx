import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Player } from '@/api/types';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/form-controls';
import { useCreatePlayer } from '@/hooks/usePlayers';
import { formatMoney } from '@/lib/format';
import { PlayerIdentityFields } from './PlayerIdentityFields';
import { createPlayerSchema, type CreatePlayerForm } from './player-form.schemas';

const ATTRIBUTE_FIELDS = [
  { name: 'pace', label: 'Velocidade' },
  { name: 'shooting', label: 'Finalização' },
  { name: 'passing', label: 'Passe' },
  { name: 'dribbling', label: 'Drible' },
  { name: 'defending', label: 'Defesa' },
  { name: 'physical', label: 'Físico' },
  { name: 'potential', label: 'Potencial' },
] as const;

function CreatePlayerFormContent({ onClose }: { onClose: () => void }) {
  const { run, isPending } = useCreatePlayer();
  const [created, setCreated] = useState<Player | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePlayerForm>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: { name: '' },
  });

  if (created) {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Jogador cadastrado</DialogTitle>
          <DialogDescription>
            {created.name} entrou como jogador livre e apto. Os valores abaixo foram calculados pela
            API.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Overall</dt>
            <dd className="text-lg font-semibold tabular-nums">{created.overall}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Valor base</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatMoney(created.base_value)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Valor de mercado</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {formatMoney(created.market_value)}
            </dd>
          </div>
        </dl>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              setCreated(null);
            }}
          >
            Cadastrar outro
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        const player = await run(values);
        if (player) setCreated(player);
      })}
    >
      <DialogHeader>
        <DialogTitle>Novo jogador</DialogTitle>
        <DialogDescription>
          O valor base e o overall são calculados pela API depois de salvar.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerIdentityFields register={register} errors={errors} />
      </div>
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">Indicadores (1 a 99)</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ATTRIBUTE_FIELDS.map((field) => (
            <FormField
              key={field.name}
              label={field.label}
              htmlFor={`player-${field.name}`}
              error={errors[field.name]?.message}
            >
              <Input
                id={`player-${field.name}`}
                type="number"
                inputMode="numeric"
                aria-invalid={Boolean(errors[field.name])}
                {...register(field.name, { valueAsNumber: true })}
              />
            </FormField>
          ))}
        </div>
      </fieldset>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Cadastrar jogador'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface CreatePlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlayerDialog({ open, onOpenChange }: CreatePlayerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <CreatePlayerFormContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
