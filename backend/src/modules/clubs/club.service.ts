import type { PrismaClient } from '@prisma/client';
import { MAX_CLUBS } from '../../domain/club-rules.js';
import { compareByNameThenId } from '../../domain/text.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';
import type { Clock } from '../../shared/clock.js';
import { contractRepository } from '../market/contract.repository.js';
import { toClubDetailResponse, toClubResponse, netWorthOf } from './club.mapper.js';
import { clubRepository, type ClubWithPlayers } from './club.repository.js';
import type { ClubSort, CreateClubInput } from './club.schemas.js';

const CLUB_COMPARATORS: Record<
  ClubSort,
  (first: ClubWithPlayers, second: ClubWithPlayers) => number
> = {
  name: () => 0,
  net_worth_asc: (first, second) => netWorthOf(first) - netWorthOf(second),
  net_worth_desc: (first, second) => netWorthOf(second) - netWorthOf(first),
};

export class ClubService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
  ) {}

  async list(sort: ClubSort) {
    const clubs = await clubRepository.findAllWithPlayers(this.prisma);
    const compare = CLUB_COMPARATORS[sort];
    return clubs
      .sort((first, second) => compare(first, second) || compareByNameThenId(first, second))
      .map(toClubResponse);
  }

  async get(id: number) {
    const club = await clubRepository.findWithPlayers(this.prisma, id);
    if (!club) throw new NotFoundError('Clube não encontrado.');
    const contracts = await contractRepository.findActiveByPlayerIds(
      this.prisma,
      club.players.map((player) => player.id),
    );
    return toClubDetailResponse(club, contracts, this.clock.now());
  }

  async create(input: CreateClubInput) {
    const normalizedName = input.name.toLowerCase();
    const created = await this.prisma.$transaction(async (tx) => {
      await clubRepository.lockClubCreation(tx);
      if ((await clubRepository.count(tx)) >= MAX_CLUBS) {
        throw new ConflictError(`A liga aceita no máximo ${MAX_CLUBS} clubes.`);
      }
      if (await clubRepository.existsByNormalizedName(tx, normalizedName)) {
        throw new ConflictError('Já existe um clube com esse nome.');
      }
      if (await clubRepository.existsByAcronym(tx, input.acronym)) {
        throw new ConflictError('Já existe um clube com essa sigla.');
      }
      return clubRepository.create(tx, {
        name: input.name,
        normalizedName,
        acronym: input.acronym,
      });
    });
    return toClubResponse({ ...created, players: [] });
  }
}
