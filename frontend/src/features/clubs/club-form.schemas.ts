import { z } from 'zod';
import { FORMATIONS } from '@/lib/domain';

export const createClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'O nome deve ter de 3 a 60 caracteres')
    .max(60, 'O nome deve ter de 3 a 60 caracteres'),
  acronym: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, 'A sigla deve ter exatamente 3 letras, de A a Z'),
});

export const lineupSchema = z.object({
  formation: z.enum(FORMATIONS, { error: 'Escolha a formação' }),
  slots: z.array(z.string().min(1, 'Escolha um titular')).length(5),
});

export type CreateClubForm = z.infer<typeof createClubSchema>;
export type LineupForm = z.infer<typeof lineupSchema>;
