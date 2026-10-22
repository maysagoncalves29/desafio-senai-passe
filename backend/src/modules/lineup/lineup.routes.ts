import { Router, type RequestHandler } from 'express';
import { validate, validated } from '../../shared/validation.js';
import { lineupParams, replaceLineupSchemas } from './lineup.schemas.js';
import type { LineupService } from './lineup.service.js';

export function createLineupRouter(service: LineupService): Router {
  const get: RequestHandler = async (_req, res) => {
    const { params } = validated(res, lineupParams);
    res.json(await service.get(params.id));
  };

  const replace: RequestHandler = async (_req, res) => {
    const { params, body } = validated(res, replaceLineupSchemas);
    res.json(await service.replace(params.id, body.formation, body.player_ids));
  };

  const router = Router();
  router.get('/clubs/:id/lineup', validate(lineupParams), get);
  router.put('/clubs/:id/lineup', validate(replaceLineupSchemas), replace);
  return router;
}
