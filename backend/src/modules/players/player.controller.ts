import type { RequestHandler } from 'express';
import { validated } from '../../shared/validation.js';
import {
  changeConditionSchemas,
  createPlayerSchemas,
  listPlayersSchemas,
  playerIdParams,
  updatePlayerSchemas,
} from './player.schemas.js';
import type { PlayerService } from './player.service.js';

const API_PREFIX = '/api/v1';

export function createPlayerController(service: PlayerService) {
  const list: RequestHandler = async (_req, res) => {
    const { query } = validated(res, listPlayersSchemas);
    res.json(await service.list(query));
  };

  const get: RequestHandler = async (_req, res) => {
    const { params } = validated(res, playerIdParams);
    res.json(await service.get(params.id));
  };

  const create: RequestHandler = async (_req, res) => {
    const { body } = validated(res, createPlayerSchemas);
    const player = await service.create(body);
    res.status(201).location(`${API_PREFIX}/players/${player.id}`).json(player);
  };

  const update: RequestHandler = async (_req, res) => {
    const { params, body } = validated(res, updatePlayerSchemas);
    res.json(await service.update(params.id, body));
  };

  const changeCondition: RequestHandler = async (_req, res) => {
    const { params, body } = validated(res, changeConditionSchemas);
    res.json(await service.changeCondition(params.id, body.condition));
  };

  const remove: RequestHandler = async (_req, res) => {
    const { params } = validated(res, playerIdParams);
    await service.remove(params.id);
    res.status(204).end();
  };

  return { list, get, create, update, changeCondition, remove };
}
