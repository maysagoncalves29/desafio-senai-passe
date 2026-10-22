import type { Contract } from '@prisma/client';
import { contractExposure } from '../../domain/trading.js';
import { formatBrasiliaDateTime } from '../../domain/brasilia-time.js';
import { fromCents, toCents, type Cents } from '../../domain/money.js';
import { toPlayerResponse } from '../players/player.mapper.js';
import { sortInSquadOrder } from '../players/squad-order.js';
import { marketValueOf } from '../players/player.calculations.js';
import type { ClubWithPlayers } from './club.repository.js';

export function squadValueOf(club: ClubWithPlayers): Cents {
  return club.players.reduce((total, player) => total + marketValueOf(player), 0);
}

export function netWorthOf(club: ClubWithPlayers): Cents {
  return toCents(club.cash) + squadValueOf(club);
}

export function toClubResponse(club: ClubWithPlayers) {
  return {
    id: club.id,
    name: club.name,
    acronym: club.acronym,
    cash: fromCents(toCents(club.cash)),
    squad_value: fromCents(squadValueOf(club)),
    net_worth: fromCents(netWorthOf(club)),
  };
}

export function toContractResponse(contract: Contract, now: Date) {
  const { remainingDays, penaltyRate } = contractExposure(contract.loyaltyUntil, now);
  return {
    purchase_value: fromCents(toCents(contract.purchaseValue)),
    loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
    remaining_days: remainingDays,
    penalty_rate: penaltyRate,
  };
}

export function toClubDetailResponse(club: ClubWithPlayers, contracts: Contract[], now: Date) {
  const contractByPlayer = new Map(contracts.map((contract) => [contract.playerId, contract]));
  return {
    ...toClubResponse(club),
    players: sortInSquadOrder(club.players).map((player) => {
      const contract = contractByPlayer.get(player.id);
      return {
        ...toPlayerResponse(player),
        contract: contract ? toContractResponse(contract, now) : null,
      };
    }),
  };
}
