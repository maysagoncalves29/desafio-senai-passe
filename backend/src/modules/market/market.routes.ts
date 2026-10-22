import { Router, type RequestHandler } from 'express';
import { validate, validated } from '../../shared/validation.js';
import type { MarketService } from './market.service.js';
import {
  buyPlayerSchemas,
  sellPlayerSchemas,
  transactionHistorySchemas,
} from './market.schemas.js';
import type { TransactionHistoryService } from './transaction-history.service.js';

export function createMarketRouter(
  market: MarketService,
  history: TransactionHistoryService,
): Router {
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

  const router = Router();
  router.post('/players/:id/buy', validate(buyPlayerSchemas), buy);
  router.post('/players/:id/sell', validate(sellPlayerSchemas), sell);
  router.get('/clubs/:id/transactions', validate(transactionHistorySchemas), listTransactions);
  router.get(
    '/clubs/:id/transactions/export',
    validate(transactionHistorySchemas),
    exportTransactions,
  );
  return router;
}
