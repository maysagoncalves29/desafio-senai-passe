import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import pino from 'pino';
import { createApp } from '../../src/app.js';
import type { Clock } from '../../src/shared/clock.js';
import { TEST_DATABASE_URL } from './global-setup.js';

export class FakeClock implements Clock {
  private current = new Date('2026-11-02T10:15:00-03:00');

  set(isoDate: string): void {
    this.current = new Date(isoDate);
  }

  now(): Date {
    return this.current;
  }
}

export const prisma = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
export const clock = new FakeClock();

const app = createApp({
  prisma,
  clock,
  logger: pino({ level: 'silent' }),
  frontendOrigin: 'http://localhost:5173',
});

export const api = () => request(app);

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE duelos_partida, partidas, escalacoes, transacoes, contratos, jogadores, clubes RESTART IDENTITY CASCADE',
  );
  clock.set('2026-11-02T10:15:00-03:00');
}

export interface PlayerOverrides {
  name?: string;
  position?: string;
  agility?: number;
  age?: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  potential?: number;
}

export const meiaLua = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

export async function createPlayer(overrides: PlayerOverrides = {}) {
  const response = await api()
    .post('/api/v1/players')
    .send({ ...meiaLua, ...overrides });
  if (response.status !== 201) throw new Error(`Falha ao criar jogador: ${response.text}`);
  return response.body as { id: number; market_value: number; base_value: number };
}

export async function createClub(name = 'Águias FC', acronym = 'AGU') {
  const response = await api().post('/api/v1/clubs').send({ name, acronym });
  if (response.status !== 201) throw new Error(`Falha ao criar clube: ${response.text}`);
  return response.body as { id: number };
}

export async function buyPlayer(
  playerId: number,
  clubId: number,
  loyaltyUntil = '2027-03-02T10:15-03:00',
) {
  return api()
    .post(`/api/v1/players/${playerId}/buy`)
    .send({ club_id: clubId, loyalty_until: loyaltyUntil });
}
