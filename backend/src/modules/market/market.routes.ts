import { Router } from 'express';
import { validate } from '../../shared/validation.js';
import { createMarketController } from './market.controller.js';
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
  const { buy, sell, listTransactions, exportTransactions } = createMarketController(
    market,
    history,
  );

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
