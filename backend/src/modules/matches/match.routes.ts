import { Router } from 'express';
import { validate } from '../../shared/validation.js';
import { createMatchController } from './match.controller.js';
import { createMatchSchemas, listMatchesSchemas, matchIdParams } from './match.schemas.js';
import type { MatchService } from './match.service.js';

export function createMatchRouter(service: MatchService): Router {
  const { list, get, play } = createMatchController(service);

  const router = Router();
  router.get('/', validate(listMatchesSchemas), list);
  router.post('/', validate(createMatchSchemas), play);
  router.get('/:id', validate(matchIdParams), get);
  return router;
}
