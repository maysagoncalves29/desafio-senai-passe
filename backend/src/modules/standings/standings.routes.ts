import { Router } from 'express';
import type { StandingsService } from './standings.service.js';

export function createStandingsRouter(service: StandingsService): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.json(await service.get());
  });
  return router;
}
