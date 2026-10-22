import { z } from 'zod';
import { CONDITIONS, POSITIONS } from '@/lib/domain';

const integerField = (label: string, min: number, max: number) =>
  z
    .number({ error: `Informe ${label}` })
    .int(`${label} deve ser um número inteiro`)
    .min(min, `${label} deve estar entre ${min} e ${max}`)
    .max(max, `${label} deve estar entre ${min} e ${max}`);

const attributeField = (label: string) => integerField(label, 1, 99);

export const playerNameField = z
  .string()
  .trim()
  .min(3, 'O nome deve ter de 3 a 100 caracteres')
  .max(100, 'O nome deve ter de 3 a 100 caracteres');

const editableShape = {
  name: playerNameField,
  position: z.enum(POSITIONS, { error: 'Escolha a posição' }),
  agility: integerField('a agilidade', 1, 100),
  age: integerField('a idade', 16, 45),
};

export function createEditPlayerSchema(currentAge: number) {
  return z.object({
    ...editableShape,
    age: editableShape.age.min(
      currentAge,
      `A idade não pode ser menor que a atual (${currentAge})`,
    ),
  });
}

export const createPlayerSchema = z.object({
  ...editableShape,
  pace: attributeField('a velocidade'),
  shooting: attributeField('a finalização'),
  passing: attributeField('o passe'),
  dribbling: attributeField('o drible'),
  defending: attributeField('a defesa'),
  physical: attributeField('o físico'),
  potential: attributeField('o potencial'),
});

export const conditionSchema = z.object({
  condition: z.enum(CONDITIONS, { error: 'Escolha a condição' }),
});

export const buyPlayerSchema = z.object({
  clubId: z.string().min(1, 'Escolha o clube comprador'),
  loyaltyUntil: z.string().min(1, 'Informe o fim da fidelidade (data e hora)'),
});

export type CreatePlayerForm = z.infer<typeof createPlayerSchema>;
export type EditPlayerForm = z.infer<ReturnType<typeof createEditPlayerSchema>>;
export type ConditionForm = z.infer<typeof conditionSchema>;
export type BuyPlayerForm = z.infer<typeof buyPlayerSchema>;
