import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Player } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdatePlayer } from '@/hooks/usePlayers';
import { PlayerIdentityFields } from './PlayerIdentityFields';
import { createEditPlayerSchema, type EditPlayerForm } from './player-form.schemas';

function EditPlayerFormContent({ player, onClose }: { player: Player; onClose: () => void }) {
  const { run, isPending } = useUpdatePlayer();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditPlayerForm>({
    resolver: zodResolver(createEditPlayerSchema(player.age)),
    defaultValues: {
      name: player.name,
      position: player.position,
      agility: player.agility,
      age: player.age,
    },
  });

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        const updated = await run({ id: player.id, ...values });
        if (updated) onClose();
      })}
    >
      <DialogHeader>
        <DialogTitle>Editar jogador</DialogTitle>
        <DialogDescription>
          Indicadores, potencial e valor base continuam os do cadastro.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <PlayerIdentityFields
          register={register}
          errors={errors}
          lockedPosition={player.club_id === null ? undefined : player.position}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EditPlayerDialogProps {
  player: Player | null;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerDialog({ player, onOpenChange }: EditPlayerDialogProps) {
  return (
    <Dialog open={player !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {player && <EditPlayerFormContent player={player} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
