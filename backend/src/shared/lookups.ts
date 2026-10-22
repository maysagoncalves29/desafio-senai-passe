import type { Club, Player } from '@prisma/client';
import type { Database } from '../infra/prisma.js';
import { clubRepository } from '../modules/clubs/club.repository.js';
import { playerRepository } from '../modules/players/player.repository.js';
import { NotFoundError } from './errors.js';

export async function requireActivePlayer(db: Database, id: number): Promise<Player> {
  const player = await playerRepository.findActiveById(db, id);
  if (!player) throw new NotFoundError('Jogador não encontrado.');
  return player;
}

export async function requireClub(db: Database, id: number): Promise<Club> {
  const club = await clubRepository.findById(db, id);
  if (!club) throw new NotFoundError('Clube não encontrado.');
  return club;
}
