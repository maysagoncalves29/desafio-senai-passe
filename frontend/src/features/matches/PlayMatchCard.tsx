import { zodResolver } from '@hookform/resolvers/zod';
import { Swords } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { MatchDetail } from '@/api/types';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/form-controls';
import { useClubsQuery } from '@/hooks/useClubs';
import { usePlayMatch } from '@/hooks/useLeague';

const playMatchSchema = z
  .object({
    homeClubId: z.string().min(1, 'Escolha o mandante'),
    awayClubId: z.string().min(1, 'Escolha o visitante'),
  })
  .refine((match) => match.homeClubId === '' || match.homeClubId !== match.awayClubId, {
    path: ['awayClubId'],
    message: 'O visitante deve ser diferente do mandante',
  });

type PlayMatchForm = z.infer<typeof playMatchSchema>;

export function PlayMatchCard({ onPlayed }: { onPlayed: (match: MatchDetail) => void }) {
  const clubs = useClubsQuery();
  const { run, isPending } = usePlayMatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlayMatchForm>({
    resolver: zodResolver(playMatchSchema),
    defaultValues: { homeClubId: '', awayClubId: '' },
  });

  const clubOptions = (
    <>
      <option value="">{clubs.isPending ? 'Carregando clubes…' : 'Selecione o clube…'}</option>
      {clubs.data?.map((club) => (
        <option key={club.id} value={club.id}>
          {club.name} ({club.acronym})
        </option>
      ))}
    </>
  );

  return (
    <Card className="p-4">
      <form
        noValidate
        className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
        onSubmit={handleSubmit(async (values) => {
          const match = await run({
            homeClubId: Number(values.homeClubId),
            awayClubId: Number(values.awayClubId),
          });
          if (match) onPlayed(match);
        })}
      >
        <FormField label="Mandante" htmlFor="match-home" error={errors.homeClubId?.message}>
          <Select
            id="match-home"
            aria-invalid={Boolean(errors.homeClubId)}
            {...register('homeClubId')}
          >
            {clubOptions}
          </Select>
        </FormField>
        <FormField label="Visitante" htmlFor="match-away" error={errors.awayClubId?.message}>
          <Select
            id="match-away"
            aria-invalid={Boolean(errors.awayClubId)}
            {...register('awayClubId')}
          >
            {clubOptions}
          </Select>
        </FormField>
        <Button type="submit" disabled={isPending} className="sm:mt-6">
          <Swords /> {isPending ? 'Jogando…' : 'Jogar partida'}
        </Button>
      </form>
    </Card>
  );
}
