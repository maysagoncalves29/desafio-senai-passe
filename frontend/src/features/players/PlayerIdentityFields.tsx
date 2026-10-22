import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FormField } from '@/components/shared/FormField';
import { Input, Select } from '@/components/ui/form-controls';
import { POSITIONS, POSITION_LABELS, type Position } from '@/lib/domain';

export interface PlayerIdentityValues {
  name: string;
  position: Position;
  agility: number;
  age: number;
}

interface PlayerIdentityFieldsProps {
  register: UseFormRegister<PlayerIdentityValues>;
  errors: FieldErrors<PlayerIdentityValues>;
  lockedPosition?: Position | undefined;
}

export function PlayerIdentityFields({
  register,
  errors,
  lockedPosition,
}: PlayerIdentityFieldsProps) {
  return (
    <>
      <div className="sm:col-span-2">
        <FormField label="Nome" htmlFor="player-name" error={errors.name?.message}>
          <Input
            id="player-name"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
      </div>
      <FormField
        label="Posição"
        htmlFor="player-position"
        error={errors.position?.message}
        {...(lockedPosition ? { hint: 'Jogador com clube não pode mudar de posição.' } : {})}
      >
        {lockedPosition ? (
          <Select id="player-position" disabled value={lockedPosition} onChange={() => undefined}>
            <option value={lockedPosition}>
              {lockedPosition} · {POSITION_LABELS[lockedPosition]}
            </option>
          </Select>
        ) : (
          <Select
            id="player-position"
            aria-invalid={Boolean(errors.position)}
            {...register('position')}
          >
            <option value="">Selecione…</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position} · {POSITION_LABELS[position]}
              </option>
            ))}
          </Select>
        )}
      </FormField>
      <FormField
        label="Agilidade (1 a 100)"
        htmlFor="player-agility"
        error={errors.agility?.message}
      >
        <Input
          id="player-agility"
          type="number"
          inputMode="numeric"
          aria-invalid={Boolean(errors.agility)}
          {...register('agility', { valueAsNumber: true })}
        />
      </FormField>
      <FormField label="Idade (16 a 45)" htmlFor="player-age" error={errors.age?.message}>
        <Input
          id="player-age"
          type="number"
          inputMode="numeric"
          aria-invalid={Boolean(errors.age)}
          {...register('age', { valueAsNumber: true })}
        />
      </FormField>
    </>
  );
}
