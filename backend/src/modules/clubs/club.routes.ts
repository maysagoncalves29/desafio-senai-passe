import { Router } from 'express';
import { validate } from '../../shared/validation.js';
import { createClubController } from './club.controller.js';
import { clubIdParams, createClubSchemas, listClubsSchemas } from './club.schemas.js';
import type { ClubService } from './club.service.js';

export function createClubRouter(service: ClubService): Router {
  const controller = createClubController(service);
  const router = Router();

  router.get('/', validate(listClubsSchemas), controller.list);
  router.post('/', validate(createClubSchemas), controller.create);
  router.get('/:id', validate(clubIdParams), controller.get);

  return router;
}
