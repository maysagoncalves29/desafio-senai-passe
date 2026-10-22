import type { RequestHandler } from 'express';
import { validated } from '../../shared/validation.js';
import type { MarketService } from './market.service.js';
import {
  buyPlayerSchemas,
  sellPlayerSchemas,
  transactionHistorySchemas,
} from './market.schemas.js';
import type { TransactionHistoryService } from './transaction-history.service.js';

export function createMarketController(market: MarketService, history: TransactionHistoryService) {
  const buy: RequestHandler = async (_req, res) => {
    const { params, body } = validated(res, buyPlayerSchemas);
    res.json(
      await market.buy(params.id, { clubId: body.club_id, loyaltyUntil: body.loyalty_until }),
    );
  };

  const sell: RequestHandler = async (_req, res) => {
    const { params } = validated(res, sellPlayerSchemas);
    res.json(await market.sell(params.id));
  };

  const listTransactions: RequestHandler = async (_req, res) => {
    const { params, query } = validated(res, transactionHistorySchemas);
    res.json(await history.list(params.id, query));
  };

  const exportTransactions: RequestHandler = async (_req, res) => {
    const { params, query } = validated(res, transactionHistorySchemas);
    const csv = await history.exportCsv(params.id, query);
    res.type('text/csv; charset=utf-8').attachment(`transacoes-clube-${params.id}.csv`).send(csv);
  };

  return { buy, sell, listTransactions, exportTransactions };
}
