import { Router } from 'express';
import { createStandingsController } from './standings.controller.js';
import type { StandingsService } from './standings.service.js';

export function createStandingsRouter(service: StandingsService): Router {
  const router = Router();
  router.get('/', createStandingsController(service).get);
  return router;
}
