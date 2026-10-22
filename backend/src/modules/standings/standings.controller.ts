import type { RequestHandler } from 'express';
import type { StandingsService } from './standings.service.js';

export function createStandingsController(service: StandingsService) {
  const get: RequestHandler = async (_req, res) => {
    res.json(await service.get());
  };

  return { get };
}
