import cors from 'cors';
import express, { Router, type Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { createErrorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { createRequestLogger } from './middlewares/request-logger.js';
import { ClubService } from './modules/clubs/club.service.js';
import { createClubRouter } from './modules/clubs/club.routes.js';
import { LineupService } from './modules/lineup/lineup.service.js';
import { createLineupRouter } from './modules/lineup/lineup.routes.js';
import { MarketService } from './modules/market/market.service.js';
import { createMarketRouter } from './modules/market/market.routes.js';
import { TransactionHistoryService } from './modules/market/transaction-history.service.js';
import { MatchService } from './modules/matches/match.service.js';
import { createMatchRouter } from './modules/matches/match.routes.js';
import { PlayerService } from './modules/players/player.service.js';
import { createPlayerRouter } from './modules/players/player.routes.js';
import { StandingsService } from './modules/standings/standings.service.js';
import { createStandingsRouter } from './modules/standings/standings.routes.js';
import { createDocsRouter } from './docs/docs.routes.js';
import type { Clock } from './shared/clock.js';

export interface AppDependencies {
  prisma: PrismaClient;
  clock: Clock;
  logger: Logger;
  frontendOrigin: string;
}

function parseOrigins(origins: string): string[] {
  return origins.split(',').map((origin) => origin.trim());
}

export function createApp({ prisma, clock, logger, frontendOrigin }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  app.use(
    cors({
      origin: parseOrigins(frontendOrigin),
      exposedHeaders: ['Location', 'Content-Disposition'],
    }),
  );
  app.use(createRequestLogger(logger));

  const api = Router();
  api.use('/players', createPlayerRouter(new PlayerService(prisma)));
  api.use(
    createMarketRouter(new MarketService(prisma, clock), new TransactionHistoryService(prisma)),
  );
  api.use('/clubs', createClubRouter(new ClubService(prisma, clock)));
  api.use(createLineupRouter(new LineupService(prisma)));
  api.use('/matches', createMatchRouter(new MatchService(prisma, clock)));
  api.use('/standings', createStandingsRouter(new StandingsService(prisma)));

  app.use('/api/v1', api);
  app.use('/docs', createDocsRouter());
  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));
  return app;
}
