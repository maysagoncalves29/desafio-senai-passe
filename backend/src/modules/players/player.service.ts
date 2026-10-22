import type { PrismaClient } from '@prisma/client';
import { calculateBaseValue } from '../../domain/base-value.js';
import { centsToDecimalString } from '../../domain/money.js';
import { calculateOverall } from '../../domain/overall.js';
import type { Condition } from '../../domain/types.js';
import { ConflictError } from '../../shared/errors.js';
import { requireActivePlayer, requireClub } from '../../shared/lookups.js';
import { lineupRepository } from '../lineup/lineup.repository.js';
import { listPlayers } from './player-listing.js';
import { toPlayerResponse } from './player.mapper.js';
import type { CreatePlayerInput, PlayerListQuery, UpdatePlayerInput } from './player.schemas.js';
import { playerRepository } from './player.repository.js';

export class PlayerService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: PlayerListQuery) {
    if (query.clubId !== undefined) await requireClub(this.prisma, query.clubId);
    const records = await playerRepository.findAllActive(this.prisma, query);
    const page = listPlayers(records, query);
    return {
      data: page.players.map(toPlayerResponse),
      meta: {
        page: page.page,
        limit: page.limit,
        total_items: page.totalItems,
        total_pages: page.totalPages,
      },
    };
  }

  async get(id: number) {
    return toPlayerResponse(await requireActivePlayer(this.prisma, id));
  }

  async create(input: CreatePlayerInput) {
    const overall = calculateOverall(input.position, input);
    const baseValue = calculateBaseValue({ overall, potential: input.potential, age: input.age });
    const player = await playerRepository.create(this.prisma, {
      ...input,
      baseValue: centsToDecimalString(baseValue),
      condition: 'APTO',
    });
    return toPlayerResponse(player);
  }

  async update(id: number, input: UpdatePlayerInput) {
    return this.prisma.$transaction(async (tx) => {
      await playerRepository.lock(tx, id);
      const current = await requireActivePlayer(tx, id);
      if (current.clubId !== null && input.position !== current.position) {
        throw new ConflictError('Jogador com clube não pode mudar de posição.');
      }
      if (input.age < current.age) {
        throw new ConflictError('A idade não pode ser menor que a idade atual do jogador.');
      }
      return toPlayerResponse(await playerRepository.update(tx, id, input));
    });
  }

  async changeCondition(id: number, condition: Condition) {
    return this.prisma.$transaction(async (tx) => {
      await playerRepository.lock(tx, id);
      const current = await requireActivePlayer(tx, id);
      if (current.condition === condition) return toPlayerResponse(current);
      if (current.condition === 'DOENTE' && condition === 'APTO') {
        throw new ConflictError('Jogador DOENTE não pode voltar direto para APTO.');
      }
      const updated = await playerRepository.update(tx, id, { condition });
      if (condition === 'DOENTE') await lineupRepository.removePlayer(tx, id);
      return toPlayerResponse(updated);
    });
  }

  async remove(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await playerRepository.lock(tx, id);
      const current = await requireActivePlayer(tx, id);
      if (current.clubId !== null) {
        throw new ConflictError('Só jogadores livres podem ser excluídos.');
      }
      await playerRepository.update(tx, id, { deletedAt: new Date() });
    });
  }
}
