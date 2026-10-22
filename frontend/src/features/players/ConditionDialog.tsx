import { zodResolver } from '@hookform/resolvers/zod';
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
import { Select } from '@/components/ui/form-controls';
import { useChangeCondition } from '@/hooks/usePlayers';
import { CONDITIONS, CONDITION_LABELS } from '@/lib/domain';
import { conditionSchema, type ConditionForm } from './player-form.schemas';

function ConditionFormContent({ player, onClose }: { player: Player; onClose: () => void }) {
  const { run, isPending } = useChangeCondition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConditionForm>({
    resolver: zodResolver(conditionSchema),
    defaultValues: { condition: player.condition },
  });
  const sickPlayer = player.condition === 'DOENTE';

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async ({ condition }) => {
        const updated = await run({ id: player.id, condition });
        if (updated) onClose();
      })}
    >
      <DialogHeader>
        <DialogTitle>Alterar condição física</DialogTitle>
        <DialogDescription>
          {player.name} está {CONDITION_LABELS[player.condition].toLowerCase()}. O valor de mercado
          é recalculado pela API.
        </DialogDescription>
      </DialogHeader>
      <FormField
        label="Nova condição"
        htmlFor="player-condition"
        error={errors.condition?.message}
        {...(sickPlayer ? { hint: 'Jogador doente não pode voltar direto para apto.' } : {})}
      >
        <Select
          id="player-condition"
          aria-invalid={Boolean(errors.condition)}
          {...register('condition')}
        >
          {CONDITIONS.map((condition) => (
            <option key={condition} value={condition} disabled={sickPlayer && condition === 'APTO'}>
              {CONDITION_LABELS[condition]}
            </option>
          ))}
        </Select>
      </FormField>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar condição'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface ConditionDialogProps {
  player: Player | null;
  onOpenChange: (open: boolean) => void;
}

export function ConditionDialog({ player, onOpenChange }: ConditionDialogProps) {
  return (
    <Dialog open={player !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {player && <ConditionFormContent player={player} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
