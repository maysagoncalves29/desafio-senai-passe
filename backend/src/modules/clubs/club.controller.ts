import type { RequestHandler } from 'express';
import { validated } from '../../shared/validation.js';
import { clubIdParams, createClubSchemas, listClubsSchemas } from './club.schemas.js';
import type { ClubService } from './club.service.js';

const API_PREFIX = '/api/v1';

export function createClubController(service: ClubService) {
  const list: RequestHandler = async (_req, res) => {
    const { query } = validated(res, listClubsSchemas);
    res.json(await service.list(query.sort));
  };

  const get: RequestHandler = async (_req, res) => {
    const { params } = validated(res, clubIdParams);
    res.json(await service.get(params.id));
  };

  const create: RequestHandler = async (_req, res) => {
    const { body } = validated(res, createClubSchemas);
    const club = await service.create(body);
    res.status(201).location(`${API_PREFIX}/clubs/${club.id}`).json(club);
  };

  return { list, get, create };
}
