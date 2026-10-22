import { beforeEach, describe, expect, it } from 'vitest';
import { api, buyPlayer, createClub, createPlayer, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);

interface Signing {
  name: string;
  position: string;
  condition?: string;
  attributes: Partial<Record<'shooting' | 'passing' | 'dribbling' | 'defending', number>>;
}

async function signPlayer(clubId: number, signing: Signing): Promise<number> {
  const attributes = {
    pace: 20,
    shooting: 20,
    passing: 20,
    dribbling: 20,
    defending: 20,
    physical: 20,
    ...signing.attributes,
  };
  const potential = Math.max(...Object.values(attributes));
  const { id } = await createPlayer({
    name: signing.name,
    position: signing.position,
    age: 28,
    ...attributes,
    potential,
  });
  const purchase = await buyPlayer(id, clubId);
  expect(purchase.status).toBe(200);
  if (signing.condition) {
    await api().patch(`/api/v1/players/${id}/condition`).send({ condition: signing.condition });
  }
  return id;
}

const eagles: Signing[] = [
  { name: 'Rui Prado', position: 'GOL', attributes: { defending: 77 } },
  { name: 'Téo Brandão', position: 'ZAG', attributes: { defending: 84 } },
  {
    name: 'Davi Lins',
    position: 'LAT',
    condition: 'MAL_CONDICIONADO',
    attributes: { dribbling: 74, defending: 66 },
  },
  { name: 'Lauro Neves', position: 'MEI', attributes: { passing: 82 } },
  { name: 'Otto Rangel', position: 'ATA', attributes: { shooting: 75 } },
];

const delta: Signing[] = [
  { name: 'Ivo Teles', position: 'GOL', attributes: { defending: 72 } },
  { name: 'Hugo Vaz', position: 'ZAG', attributes: { defending: 84 } },
  { name: 'Lino Matos', position: 'LAT', attributes: { dribbling: 79, defending: 63 } },
  { name: 'Nei Soares', position: 'MEI', attributes: { passing: 70 } },
  { name: 'Ugo Falcão', position: 'ATA', attributes: { shooting: 81 } },
];

async function buildClub(name: string, acronym: string, signings: Signing[]) {
  const { id } = await createClub(name, acronym);
  const playerIds: number[] = [];
  for (const signing of signings) playerIds.push(await signPlayer(id, signing));
  return { id, playerIds };
}

describe('escalação (RN19)', () => {
  it('escala em qualquer ordem, devolve na ordem do elenco e substitui a escalação inteira', async () => {
    const club = await buildClub('Águias FC', 'AGU', eagles);
    const [rui, teo, davi, lauro, otto] = club.playerIds as [
      number,
      number,
      number,
      number,
      number,
    ];

    const empty = await api().get(`/api/v1/clubs/${club.id}/lineup`);
    expect(empty.body).toEqual({ club_id: club.id, formation: null, complete: false, players: [] });

    const response = await api()
      .put(`/api/v1/clubs/${club.id}/lineup`)
      .send({ formation: '2-1-1', player_ids: [otto, davi, rui, lauro, teo] });
    expect(response.status).toBe(200);
    expect(response.body.complete).toBe(true);
    expect(response.body.players.map((player: { name: string }) => player.name)).toEqual([
      'Rui Prado',
      'Téo Brandão',
      'Davi Lins',
      'Lauro Neves',
      'Otto Rangel',
    ]);

    const cash = (await api().get(`/api/v1/clubs/${club.id}`)).body.cash;
    const rejected = await api()
      .put(`/api/v1/clubs/${club.id}/lineup`)
      .send({ formation: '2-2', player_ids: [otto, davi, rui, lauro, teo] });
    expect(rejected.status).toBe(409);
    expect((await api().get(`/api/v1/clubs/${club.id}/lineup`)).body.formation).toBe('2-1-1');
    expect((await api().get(`/api/v1/clubs/${club.id}`)).body.cash).toBe(cash);
  });

  it('valida formato (400), existência (404) e regras (409)', async () => {
    const club = await buildClub('Águias FC', 'AGU', eagles);
    const other = await buildClub('Delta FC', 'DEL', delta);
    const [rui, teo, davi, lauro, otto] = club.playerIds as [
      number,
      number,
      number,
      number,
      number,
    ];
    const url = `/api/v1/clubs/${club.id}/lineup`;

    expect((await api().put(url).send({ player_ids: club.playerIds })).status).toBe(400);
    expect(
      (await api().put(url).send({ formation: '4-0', player_ids: club.playerIds })).status,
    ).toBe(400);
    expect(
      (
        await api()
          .put(url)
          .send({ formation: '2-1-1', player_ids: [rui, teo, davi, lauro] })
      ).status,
    ).toBe(400);
    expect(
      (
        await api()
          .put(url)
          .send({ formation: '2-1-1', player_ids: [rui, rui, davi, lauro, otto] })
      ).status,
    ).toBe(400);
    expect(
      (
        await api()
          .put(url)
          .send({ formation: '2-1-1', player_ids: [rui, teo, davi, lauro, -1] })
      ).status,
    ).toBe(400);
    expect(
      (
        await api()
          .put(url)
          .send({ formation: '2-1-1', player_ids: [rui, teo, davi, lauro, 9999] })
      ).status,
    ).toBe(404);
    expect(
      (
        await api()
          .put('/api/v1/clubs/999/lineup')
          .send({ formation: '2-1-1', player_ids: club.playerIds })
      ).status,
    ).toBe(404);
    expect(
      (
        await api()
          .put(url)
          .send({ formation: '2-1-1', player_ids: [rui, teo, davi, lauro, other.playerIds[4]] })
      ).status,
    ).toBe(409);

    await api().patch(`/api/v1/players/${otto}/condition`).send({ condition: 'DOENTE' });
    expect(
      (await api().put(url).send({ formation: '2-1-1', player_ids: club.playerIds })).status,
    ).toBe(409);
    expect((await api().get(url)).body.players).toEqual([]);
  });

  it('tira o titular vendido ou doente e mantém a formação', async () => {
    const club = await buildClub('Águias FC', 'AGU', eagles);
    const [, , , lauro, otto] = club.playerIds as [number, number, number, number, number];
    await api()
      .put(`/api/v1/clubs/${club.id}/lineup`)
      .send({ formation: '2-1-1', player_ids: club.playerIds });

    await api().patch(`/api/v1/players/${otto}/condition`).send({ condition: 'DOENTE' });
    let lineup = (await api().get(`/api/v1/clubs/${club.id}/lineup`)).body;
    expect(lineup).toMatchObject({ formation: '2-1-1', complete: false });
    expect(lineup.players).toHaveLength(4);

    await api().post(`/api/v1/players/${lauro}/sell`);
    lineup = (await api().get(`/api/v1/clubs/${club.id}/lineup`)).body;
    expect(lineup.players).toHaveLength(3);
  });
});

describe('partidas e classificação (RN20 e RN21)', () => {
  async function prepareMatch() {
    const home = await buildClub('Águias FC', 'AGU', eagles);
    const away = await buildClub('Delta FC', 'DEL', delta);
    await api()
      .put(`/api/v1/clubs/${home.id}/lineup`)
      .send({ formation: '2-1-1', player_ids: home.playerIds });
    await api()
      .put(`/api/v1/clubs/${away.id}/lineup`)
      .send({ formation: '2-1-1', player_ids: away.playerIds });
    return { home, away };
  }

  it('joga o exemplo Águias FC 1 x 2 Delta FC com os 6 duelos', async () => {
    const { home, away } = await prepareMatch();
    const gama = await createClub('Gama SC', 'GAM');

    const response = await api()
      .post('/api/v1/matches')
      .send({ home_club_id: home.id, away_club_id: away.id });
    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/v1/matches/${response.body.id}`);
    expect(response.body).toMatchObject({
      home: { club_id: home.id, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
      away: { club_id: away.id, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
      result: 'VISITANTE',
    });
    expect(response.body.duels).toHaveLength(6);
    expect(response.body.duels.map((duel: { goal: boolean }) => duel.goal)).toEqual([
      true,
      false,
      false,
      true,
      false,
      true,
    ]);
    expect(response.body.duels[2]).toMatchObject({
      order: 3,
      attacking_club_id: home.id,
      attacker: {
        player_name: 'Davi Lins',
        position: 'LAT',
        condition: 'MAL_CONDICIONADO',
        attribute: 'dribbling',
        value: 63,
      },
      defender: { player_name: 'Lino Matos', attribute: 'defending', value: 63 },
    });
    expect(response.body.duels[5]).toMatchObject({
      order: 6,
      attacking_club_id: away.id,
      defender: { player_name: 'Davi Lins', value: 56 },
    });

    const detail = await api().get(`/api/v1/matches/${response.body.id}`);
    expect(detail.body.duels).toHaveLength(6);

    const list = await api().get('/api/v1/matches');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].duels).toBeUndefined();
    expect((await api().get(`/api/v1/matches?club_id=${gama.id}`)).body).toEqual([]);
    expect((await api().get('/api/v1/matches?club_id=999')).status).toBe(404);

    const standings = await api().get('/api/v1/standings');
    expect(standings.body.map((row: { club_name: string }) => row.club_name)).toEqual([
      'Delta FC',
      'Gama SC',
      'Águias FC',
    ]);
    expect(standings.body[0]).toEqual({
      position: 1,
      club_id: away.id,
      club_name: 'Delta FC',
      played: 1,
      wins: 1,
      draws: 0,
      losses: 0,
      goals_for: 2,
      goals_against: 1,
      goal_difference: 1,
      points: 3,
    });
    expect(standings.body[2]).toMatchObject({ goal_difference: -1, points: 0, losses: 1 });
  });

  it('não altera caixa, escalação nem jogadores e permite repetir o confronto', async () => {
    const { home, away } = await prepareMatch();
    const before = (await api().get(`/api/v1/clubs/${home.id}`)).body;
    await api().post('/api/v1/matches').send({ home_club_id: home.id, away_club_id: away.id });
    await api().post('/api/v1/matches').send({ home_club_id: home.id, away_club_id: away.id });
    expect((await api().get(`/api/v1/clubs/${home.id}`)).body).toEqual(before);
    expect((await api().get(`/api/v1/clubs/${home.id}/lineup`)).body.complete).toBe(true);
    expect((await api().get('/api/v1/matches')).body).toHaveLength(2);
  });

  it('recusa partidas inválidas sem gravar nada', async () => {
    const { home, away } = await prepareMatch();
    const empty = await createClub('Gama SC', 'GAM');
    const post = (body: object) => api().post('/api/v1/matches').send(body);

    expect((await post({ home_club_id: home.id, away_club_id: home.id })).status).toBe(400);
    expect((await post({ home_club_id: 0, away_club_id: away.id })).status).toBe(400);
    expect((await post({ home_club_id: home.id })).status).toBe(400);
    expect((await post({ home_club_id: home.id, away_club_id: 999 })).status).toBe(404);
    expect((await post({ home_club_id: empty.id, away_club_id: away.id })).status).toBe(409);

    await api()
      .patch(`/api/v1/players/${away.playerIds[4]}/condition`)
      .send({ condition: 'DOENTE' });
    expect((await post({ home_club_id: home.id, away_club_id: away.id })).status).toBe(409);
    expect((await api().get('/api/v1/matches')).body).toEqual([]);
    expect((await api().get('/api/v1/matches/999')).status).toBe(404);
  });
});
