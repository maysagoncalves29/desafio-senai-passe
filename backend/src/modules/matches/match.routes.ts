import { Router, type RequestHandler } from 'express';
import { validate, validated } from '../../shared/validation.js';
import { createMatchSchemas, listMatchesSchemas, matchIdParams } from './match.schemas.js';
import type { MatchService } from './match.service.js';

const API_PREFIX = '/api/v1';

export function createMatchRouter(service: MatchService): Router {
  const list: RequestHandler = async (_req, res) => {
    const { query } = validated(res, listMatchesSchemas);
    res.json(await service.list(query.clubId));
  };

  const get: RequestHandler = async (_req, res) => {
    const { params } = validated(res, matchIdParams);
    res.json(await service.get(params.id));
  };

  const play: RequestHandler = async (_req, res) => {
    const { body } = validated(res, createMatchSchemas);
    const match = await service.play(body.home_club_id, body.away_club_id);
    res.status(201).location(`${API_PREFIX}/matches/${match.id}`).json(match);
  };

  const router = Router();
  router.get('/', validate(listMatchesSchemas), list);
  router.post('/', validate(createMatchSchemas), play);
  router.get('/:id', validate(matchIdParams), get);
  return router;
}
