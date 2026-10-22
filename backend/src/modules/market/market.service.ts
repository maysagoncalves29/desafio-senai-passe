import type { PrismaClient } from '@prisma/client';
import { formatBrasiliaDateTime } from '../../domain/brasilia-time.js';
import { MAX_SQUAD_SIZE } from '../../domain/club-rules.js';
import { centsToDecimalString, fromCents, toCents } from '../../domain/money.js';
import { marketValueOf } from '../players/player.calculations.js';
import {
  calculateSale,
  isLoyaltyDateAllowed,
  isWithinCashLimit,
  purchaseFee,
} from '../../domain/trading.js';
import type { Clock } from '../../shared/clock.js';
import { ConflictError, ValidationError } from '../../shared/errors.js';
import { formatMoney } from '../../shared/format.js';
import { requireActivePlayer, requireClub } from '../../shared/lookups.js';
import { clubRepository } from '../clubs/club.repository.js';
import { lineupRepository } from '../lineup/lineup.repository.js';
import { playerRepository } from '../players/player.repository.js';
import { contractRepository } from './contract.repository.js';
import { toTransactionResponse } from './transaction.mapper.js';
import { transactionRepository } from './transaction.repository.js';

export interface PurchaseInput {
  clubId: number;
  loyaltyUntil: Date;
}

export class MarketService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
  ) {}

  async buy(playerId: number, input: PurchaseInput) {
    const now = this.clock.now();
    if (!isLoyaltyDateAllowed(input.loyaltyUntil, now)) {
      throw new ValidationError(
        'O fim da fidelidade deve ser depois da compra e até 1.095 dias depois dela.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await playerRepository.lock(tx, playerId);
      const player = await requireActivePlayer(tx, playerId);
      await clubRepository.lock(tx, input.clubId);
      const club = await requireClub(tx, input.clubId);

      if (player.clubId !== null) throw new ConflictError('O jogador não está livre.');
      if (await transactionRepository.existsSale(tx, club.id, player.id)) {
        throw new ConflictError('Um clube não pode comprar um jogador que ele mesmo já vendeu.');
      }
      if ((await playerRepository.countByClub(tx, club.id)) >= MAX_SQUAD_SIZE) {
        throw new ConflictError(`O elenco já tem ${MAX_SQUAD_SIZE} jogadores.`);
      }

      const marketValue = marketValueOf(player);
      const fee = purchaseFee(marketValue);
      const totalCost = marketValue + fee;
      const cash = toCents(club.cash);
      if (!isWithinCashLimit(totalCost, cash)) {
        throw new ConflictError(
          `O custo da compra (${formatMoney(totalCost)}) passa do limite de 50% do caixa (${formatMoney(Math.floor(cash / 2))}).`,
        );
      }

      const newCash = cash - totalCost;
      await clubRepository.update(tx, club.id, { cash: centsToDecimalString(newCash) });
      await playerRepository.update(tx, player.id, { clubId: club.id });
      const contract = await contractRepository.create(tx, {
        playerId: player.id,
        clubId: club.id,
        purchaseValue: centsToDecimalString(marketValue),
        loyaltyUntil: input.loyaltyUntil,
        status: 'ATIVO',
        startedAt: now,
      });
      const transaction = await transactionRepository.create(tx, {
        clubId: club.id,
        playerId: player.id,
        playerName: player.name,
        type: 'COMPRA',
        value: centsToDecimalString(marketValue),
        fee: centsToDecimalString(fee),
        penalty: centsToDecimalString(0),
        profit: null,
        cashChange: centsToDecimalString(-totalCost),
        createdAt: now,
      });

      return {
        ...toTransactionResponse(transaction),
        contract: {
          purchase_value: fromCents(marketValue),
          loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
          status: contract.status,
        },
        club_cash: fromCents(newCash),
      };
    });
  }

  async sell(playerId: number) {
    const now = this.clock.now();

    return this.prisma.$transaction(async (tx) => {
      await playerRepository.lock(tx, playerId);
      const player = await requireActivePlayer(tx, playerId);
      if (player.clubId === null)
        throw new ConflictError('O jogador está livre e não pode ser vendido.');
      await clubRepository.lock(tx, player.clubId);
      const club = await requireClub(tx, player.clubId);

      const contract = await contractRepository.findActiveByPlayerId(tx, player.id);
      if (!contract) throw new Error(`Jogador ${player.id} está em um clube sem contrato ativo.`);

      const marketValue = marketValueOf(player);
      const purchaseValue = toCents(contract.purchaseValue);
      const sale = calculateSale({
        marketValue,
        purchaseValue,
        loyaltyUntil: contract.loyaltyUntil,
        now,
      });
      const newCash = toCents(club.cash) + sale.credit;

      await contractRepository.close(tx, contract.id, sale.contractStatus, now);
      await clubRepository.update(tx, club.id, { cash: centsToDecimalString(newCash) });
      await playerRepository.update(tx, player.id, { clubId: null });
      await lineupRepository.removePlayer(tx, player.id);
      const transaction = await transactionRepository.create(tx, {
        clubId: club.id,
        playerId: player.id,
        playerName: player.name,
        type: 'VENDA',
        value: centsToDecimalString(marketValue),
        fee: centsToDecimalString(sale.commission),
        penalty: centsToDecimalString(sale.penalty),
        profit: centsToDecimalString(sale.profit),
        cashChange: centsToDecimalString(sale.credit),
        createdAt: now,
      });

      return {
        ...toTransactionResponse(transaction),
        purchase_value: fromCents(purchaseValue),
        remaining_days: sale.remainingDays,
        penalty_rate: sale.penaltyRate,
        contract_status: sale.contractStatus,
        club_cash: fromCents(newCash),
      };
    });
  }
}
