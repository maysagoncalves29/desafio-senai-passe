import { beforeEach, describe, expect, it } from 'vitest';
import { api, buyPlayer, createClub, createPlayer, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);

describe('concorrência', () => {
  it('só um clube consegue comprar o mesmo jogador livre ao mesmo tempo', async () => {
    const { id: playerId } = await createPlayer();
    const first = await createClub('Águias FC', 'AGU');
    const second = await createClub('Delta FC', 'DEL');

    const results = await Promise.all([
      buyPlayer(playerId, first.id),
      buyPlayer(playerId, second.id),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    const player = (await api().get(`/api/v1/players/${playerId}`)).body;
    const winner = results.find((result) => result.status === 200)!.body.club_id;
    expect(player.club_id).toBe(winner);

    const clubs = (await api().get('/api/v1/clubs')).body as { id: number; cash: number }[];
    expect(clubs.filter((club) => club.cash < 300)).toHaveLength(1);
  });

  it('respeita o limite de 50% do caixa quando o mesmo clube compra vários jogadores ao mesmo tempo', async () => {
    const { id: clubId } = await createClub();
    const names = ['Primeiro Craque', 'Segundo Craque', 'Terceiro Craque'];
    const players = await Promise.all(
      names.map((name) =>
        createPlayer({
          name,
          position: 'ATA',
          age: 27,
          pace: 85,
          shooting: 90,
          passing: 70,
          dribbling: 85,
          defending: 1,
          physical: 80,
          potential: 90,
        }),
      ),
    );
    expect(players.every((player) => player.market_value === 100)).toBe(true);

    const results = await Promise.all(players.map((player) => buyPlayer(player.id, clubId)));

    expect(results.filter((result) => result.status === 200)).toHaveLength(1);
    expect(results.filter((result) => result.status === 409)).toHaveLength(2);
    const club = (await api().get(`/api/v1/clubs/${clubId}`)).body;
    expect(club.cash).toBe(195);
    expect(club.players).toHaveLength(1);
  });
});
