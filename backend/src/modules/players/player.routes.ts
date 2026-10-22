import { Router } from 'express';
import { validate } from '../../shared/validation.js';
import { createPlayerController } from './player.controller.js';
import {
  changeConditionSchemas,
  createPlayerSchemas,
  listPlayersSchemas,
  playerIdParams,
  updatePlayerSchemas,
} from './player.schemas.js';
import type { PlayerService } from './player.service.js';

export function createPlayerRouter(service: PlayerService): Router {
  const controller = createPlayerController(service);
  const router = Router();

  router.get('/', validate(listPlayersSchemas), controller.list);
  router.post('/', validate(createPlayerSchemas), controller.create);
  router.get('/:id', validate(playerIdParams), controller.get);
  router.put('/:id', validate(updatePlayerSchemas), controller.update);
  router.patch('/:id/condition', validate(changeConditionSchemas), controller.changeCondition);
  router.delete('/:id', validate(playerIdParams), controller.remove);

  return router;
}
