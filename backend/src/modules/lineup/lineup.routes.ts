import { Router } from 'express';
import { validate } from '../../shared/validation.js';
import { createLineupController } from './lineup.controller.js';
import { lineupParams, replaceLineupSchemas } from './lineup.schemas.js';
import type { LineupService } from './lineup.service.js';

export function createLineupRouter(service: LineupService): Router {
  const { get, replace } = createLineupController(service);

  const router = Router();
  router.get('/clubs/:id/lineup', validate(lineupParams), get);
  router.put('/clubs/:id/lineup', validate(replaceLineupSchemas), replace);
  return router;
}
