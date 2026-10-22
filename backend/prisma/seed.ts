import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ClubService } from '../src/modules/clubs/club.service.js';
import { LineupService } from '../src/modules/lineup/lineup.service.js';
import { MarketService } from '../src/modules/market/market.service.js';
import { MatchService } from '../src/modules/matches/match.service.js';
import { PlayerService } from '../src/modules/players/player.service.js';
import type { Condition, Formation, Position } from '../src/domain/types.js';
import { systemClock } from '../src/shared/clock.js';

const prisma = new PrismaClient();
const players = new PlayerService(prisma);
const clubs = new ClubService(prisma, systemClock);
const market = new MarketService(prisma, systemClock);
const lineups = new LineupService(prisma);
const matches = new MatchService(prisma, systemClock);

type Attributes = [number, number, number, number, number, number];

interface SeedPlayer {
  name: string;
  position: Position;
  age: number;
  agility: number;
  attributes: Attributes;
  potential: number;
  condition?: Condition;
}

const seedPlayer = (
  name: string,
  position: Position,
  age: number,
  agility: number,
  attributes: Attributes,
  potential: number,
  condition?: Condition,
): SeedPlayer => ({ name, position, age, agility, attributes, potential, condition });

const SQUADS: { name: string; acronym: string; players: SeedPlayer[] }[] = [
  {
    name: 'Águias FC',
    acronym: 'AGU',
    players: [
      seedPlayer('Rui Prado', 'GOL', 28, 60, [55, 30, 65, 40, 77, 68], 80),
      seedPlayer('Téo Brandão', 'ZAG', 27, 55, [50, 35, 60, 40, 84, 75], 86),
      seedPlayer('Davi Lins', 'LAT', 24, 72, [72, 45, 70, 74, 66, 66], 80, 'MAL_CONDICIONADO'),
      seedPlayer('Lauro Neves', 'MEI', 26, 65, [68, 65, 82, 78, 52, 60], 85),
      seedPlayer('Otto Rangel', 'ATA', 25, 70, [78, 75, 73, 82, 48, 68], 84),
    ],
  },
  {
    name: 'Delta FC',
    acronym: 'DEL',
    players: [
      seedPlayer('Ivo Teles', 'GOL', 30, 58, [52, 30, 60, 35, 72, 66], 75),
      seedPlayer('Hugo Vaz', 'ZAG', 29, 50, [48, 34, 58, 40, 84, 74], 84),
      seedPlayer('Lino Matos', 'LAT', 23, 75, [70, 50, 68, 79, 63, 64], 82),
      seedPlayer('Nei Soares', 'MEI', 27, 62, [66, 60, 70, 72, 50, 58], 78),
      seedPlayer('Ugo Falcão', 'ATA', 26, 82, [80, 81, 66, 78, 40, 70], 86),
    ],
  },
  {
    name: 'Épsilon EC',
    acronym: 'EPS',
    players: [
      seedPlayer('Caio Mendes', 'GOL', 32, 55, [50, 28, 58, 33, 70, 64], 72),
      seedPlayer('Bruno Tavares', 'ZAG', 29, 48, [46, 30, 55, 38, 74, 71], 78),
      seedPlayer('Felipe Rocha', 'MEI', 22, 80, [64, 58, 68, 70, 46, 55], 82),
    ],
  },
  {
    name: 'Gama SC',
    acronym: 'GAM',
    players: [
      seedPlayer('Danilo Freitas', 'LAT', 31, 25, [66, 40, 62, 68, 70, 65], 70, 'MAL_CONDICIONADO'),
      seedPlayer('Marcos Pinto', 'ATA', 24, 78, [76, 77, 60, 74, 38, 66], 80),
      seedPlayer('Igor Santana', 'ZAG', 28, 52, [49, 32, 57, 39, 79, 72], 81),
    ],
  },
  { name: 'Mangue FC', acronym: 'MAN', players: [] },
  { name: 'Tubarões EC', acronym: 'TUB', players: [] },
];

const FREE_PLAYERS: SeedPlayer[] = [
  seedPlayer('André Lacerda', 'GOL', 31, 50, [48, 25, 55, 30, 68, 70], 71),
  seedPlayer('Meia Lua', 'MEI', 25, 85, [70, 68, 82, 79, 55, 64], 86),
  seedPlayer('Davi Melo', 'MEI', 22, 70, [62, 55, 66, 68, 44, 54], 80),
  seedPlayer('Zé Foguete', 'ATA', 19, 90, [84, 70, 58, 76, 30, 60], 90),
  seedPlayer('Paulo Veterano', 'ZAG', 36, 40, [40, 30, 55, 36, 76, 70], 76),
  seedPlayer('Leo Cardoso', 'LAT', 31, 66, [68, 42, 64, 66, 64, 62], 70, 'DOENTE'),
  seedPlayer('Sérgio Antunes', 'ATA', 34, 45, [58, 72, 55, 64, 36, 60], 72),
];

const LOYALTY_DAYS = 400;
const FORMATION: Formation = '2-1-1';

function createPlayer(seed: SeedPlayer) {
  const [pace, shooting, passing, dribbling, defending, physical] = seed.attributes;
  return players.create({
    name: seed.name,
    position: seed.position,
    age: seed.age,
    agility: seed.agility,
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
    potential: seed.potential,
  });
}

async function applyCondition(playerId: number, condition: Condition | undefined) {
  if (condition) await players.changeCondition(playerId, condition);
}

async function seedClub(squad: (typeof SQUADS)[number]) {
  const club = await clubs.create({ name: squad.name, acronym: squad.acronym });
  const loyaltyUntil = new Date(systemClock.now().getTime() + LOYALTY_DAYS * 24 * 60 * 60 * 1000);
  loyaltyUntil.setSeconds(0, 0);

  const signedIds: number[] = [];
  for (const seed of squad.players) {
    const player = await createPlayer(seed);
    await market.buy(player.id, { clubId: club.id, loyaltyUntil });
    await applyCondition(player.id, seed.condition);
    signedIds.push(player.id);
  }
  return { clubId: club.id, signedIds };
}

async function main() {
  if ((await prisma.player.count()) > 0 || (await prisma.club.count()) > 0) {
    process.stdout.write(
      'O banco já tem dados. Recrie-o com "npm run db:reset" antes de popular.\n',
    );
    return;
  }

  const created = [];
  for (const squad of SQUADS) created.push(await seedClub(squad));
  for (const seed of FREE_PLAYERS)
    await applyCondition((await createPlayer(seed)).id, seed.condition);

  const [eagles, delta] = created as [(typeof created)[number], (typeof created)[number]];
  for (const club of [eagles, delta]) {
    await lineups.replace(club.clubId, FORMATION, club.signedIds);
  }
  await matches.play(eagles.clubId, delta.clubId);
  await matches.play(delta.clubId, eagles.clubId);

  process.stdout.write('Dados de exemplo criados: 6 clubes, 23 jogadores e 2 partidas.\n');
}

main().finally(() => prisma.$disconnect());
