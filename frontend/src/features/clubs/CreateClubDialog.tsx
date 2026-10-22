import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { useCreateClub } from '@/hooks/useClubs';
import { createClubSchema, type CreateClubForm } from './club-form.schemas';

function CreateClubFormContent({ onClose }: { onClose: () => void }) {
  const { run, isPending } = useCreateClub();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClubForm>({
    resolver: zodResolver(createClubSchema),
    defaultValues: { name: '', acronym: '' },
  });

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        const club = await run({ name: values.name, acronym: values.acronym.toUpperCase() });
        if (club) onClose();
      })}
    >
      <DialogHeader>
        <DialogTitle>Novo clube</DialogTitle>
        <DialogDescription>
          O clube começa com 300,00 de caixa e sem jogadores. A sigla usa 3 letras do nome, na
          ordem.
        </DialogDescription>
      </DialogHeader>
      <FormField label="Nome do clube" htmlFor="club-name" error={errors.name?.message}>
        <Input
          id="club-name"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
      </FormField>
      <FormField
        label="Sigla (3 letras)"
        htmlFor="club-acronym"
        error={errors.acronym?.message}
        hint="Ex.: AGU para Águias FC"
      >
        <Input
          id="club-acronym"
          autoComplete="off"
          maxLength={3}
          className="uppercase"
          aria-invalid={Boolean(errors.acronym)}
          {...register('acronym')}
        />
      </FormField>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Criando…' : 'Criar clube'}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface CreateClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateClubDialog({ open, onOpenChange }: CreateClubDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <CreateClubFormContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
