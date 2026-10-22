import { beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  buyPlayer,
  clock,
  createClub,
  createPlayer,
  meiaLua,
  resetDatabase,
} from './helpers.js';

beforeEach(resetDatabase);

describe('jogadores', () => {
  it('cadastra o Meia Lua com valor base, overall e Location (RN06)', async () => {
    const response = await api()
      .post('/api/v1/players')
      .send({ ...meiaLua, base_value: 999, condition: 'DOENTE', club_id: 5, overall: 1 });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/v1/players/${response.body.id}`);
    expect(response.body).toMatchObject({
      name: 'Meia Lua',
      condition: 'APTO',
      base_value: 40,
      market_value: 40,
      overall: 75,
      club_id: null,
    });
  });

  it('altera a condição e recalcula o valor de mercado (RN05)', async () => {
    const { id } = await createPlayer();

    const injured = await api()
      .patch(`/api/v1/players/${id}/condition`)
      .send({ condition: 'MAL_CONDICIONADO' });
    expect(injured.status).toBe(200);
    expect(injured.body.market_value).toBe(37);

    await api().patch(`/api/v1/players/${id}/condition`).send({ condition: 'DOENTE' });
    const forbidden = await api()
      .patch(`/api/v1/players/${id}/condition`)
      .send({ condition: 'APTO' });
    expect(forbidden.status).toBe(409);
    expect(forbidden.body.message).toBeTruthy();

    const same = await api().patch(`/api/v1/players/${id}/condition`).send({ condition: 'DOENTE' });
    expect(same.status).toBe(200);
  });

  it.each([
    ['nome com um só nome', { name: 'Meia' }],
    ['nome com dígito', { name: 'Meia Lua 2' }],
    ['nome muito curto', { name: 'Al' }],
    ['posição em minúsculas', { position: 'mei' }],
    ['agilidade acima de 100', { agility: 101 }],
    ['agilidade acima de 85 com 35 anos', { age: 35, agility: 90, potential: 82 }],
    ['idade menor que 16', { age: 15 }],
    ['agilidade decimal', { agility: 50.5 }],
    ['agilidade em texto', { agility: '50' }],
    [
      'soma dos atributos acima de 480',
      {
        pace: 99,
        shooting: 99,
        passing: 99,
        dribbling: 99,
        defending: 99,
        physical: 99,
        potential: 99,
      },
    ],
    ['potencial menor que o maior atributo', { potential: 80 }],
    ['potencial diferente do maior atributo aos 33 anos', { age: 33, potential: 90 }],
  ])('recusa cadastro com %s (400)', async (_description, overrides) => {
    const response = await api()
      .post('/api/v1/players')
      .send({ ...meiaLua, ...overrides });
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body.message).toBeTruthy();
    expect((await api().get('/api/v1/players')).body.meta.total_items).toBe(0);
  });

  it('recusa corpo que não é objeto, JSON inválido e campo ausente (V1, V6)', async () => {
    for (const payload of ['[]', '"x"', '10', 'null', '{']) {
      const response = await api()
        .post('/api/v1/players')
        .set('Content-Type', 'application/json')
        .send(payload);
      expect(response.status).toBe(400);
      expect(response.body.message).toBeTruthy();
    }
    const missing = await api()
      .post('/api/v1/players')
      .send({ ...meiaLua, Agility: 70, agility: undefined });
    expect(missing.status).toBe(400);
  });

  it('normaliza espaços do nome (V4)', async () => {
    const response = await api()
      .post('/api/v1/players')
      .send({ ...meiaLua, name: '  Meia   Zeta ' });
    expect(response.body.name).toBe('Meia Zeta');
    const control = await api()
      .post('/api/v1/players')
      .send({ ...meiaLua, name: 'Meia\tZeta' });
    expect(control.status).toBe(400);
  });

  it('trata ids inválidos na URL como inexistentes (V8)', async () => {
    for (const id of ['abc', '0', '-1', '1.5', '01', '2147483648', '999']) {
      const response = await api().get(`/api/v1/players/${id}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBeTruthy();
    }
    expect((await api().get('/api/v1/inexistente')).status).toBe(404);
  });

  it('edita nome, posição, agilidade e idade preservando valor base (RN08)', async () => {
    const { id } = await createPlayer({ age: 20 });
    const response = await api()
      .put(`/api/v1/players/${id}`)
      .send({ name: 'Davi Melo', position: 'ATA', agility: 70, age: 23, base_value: 1 });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Davi Melo', position: 'ATA', age: 23 });
    expect(response.body.base_value).toBeGreaterThan(40);

    const younger = await api()
      .put(`/api/v1/players/${id}`)
      .send({ name: 'Davi Melo', position: 'ATA', agility: 70, age: 22 });
    expect(younger.status).toBe(409);
  });

  it('exclui logicamente só jogador livre (RN09)', async () => {
    const free = await createPlayer({ name: 'Joao Livre' });
    const owned = await createPlayer({ name: 'Pedro Preso' });
    const club = await createClub();
    await buyPlayer(owned.id, club.id);

    expect((await api().delete(`/api/v1/players/${owned.id}`)).status).toBe(409);
    const removed = await api().delete(`/api/v1/players/${free.id}`);
    expect(removed.status).toBe(204);
    expect(removed.text).toBe('');
    expect((await api().get(`/api/v1/players/${free.id}`)).status).toBe(404);
    expect((await api().delete(`/api/v1/players/${free.id}`)).status).toBe(404);
    expect((await api().get('/api/v1/players')).body.meta.total_items).toBe(1);
  });
});

describe('listagem de jogadores (RN07)', () => {
  beforeEach(async () => {
    await createPlayer({ name: 'João Silva', position: 'ATA', age: 30 });
    await createPlayer({ name: 'Meia Lua', position: 'MEI', age: 25 });
    await createPlayer({ name: 'Ana Lima', position: 'GOL', age: 40, agility: 60, potential: 82 });
    await createPlayer({ name: 'Ana-Maria Souza', position: 'ZAG', age: 18, agility: 60 });
  });

  it('busca ignorando acentos e maiúsculas', async () => {
    const joao = await api().get('/api/v1/players?search=joao');
    expect(joao.body.data.map((player: { name: string }) => player.name)).toEqual(['João Silva']);
    const lua = await api().get('/api/v1/players?search=LUA');
    expect(lua.body.data).toHaveLength(1);
  });

  it('ordena por nome com espaço antes do hífen, por posição e por dois critérios', async () => {
    const byName = await api().get('/api/v1/players');
    expect(byName.body.data.map((player: { name: string }) => player.name)).toEqual([
      'Ana Lima',
      'Ana-Maria Souza',
      'João Silva',
      'Meia Lua',
    ]);
    const byPosition = await api().get('/api/v1/players?sort=position');
    expect(byPosition.body.data.map((player: { position: string }) => player.position)).toEqual([
      'GOL',
      'ZAG',
      'MEI',
      'ATA',
    ]);
    const byAge = await api().get('/api/v1/players?sort=age_desc,value_asc');
    expect(byAge.body.data[0].age).toBe(40);
  });

  it('pagina depois de filtrar e informa o meta', async () => {
    const page = await api().get('/api/v1/players?limit=3&page=2');
    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta).toEqual({ page: 2, limit: 3, total_items: 4, total_pages: 2 });
    const beyond = await api().get('/api/v1/players?limit=3&page=9');
    expect(beyond.status).toBe(200);
    expect(beyond.body.data).toEqual([]);
    expect(beyond.body.meta.total_pages).toBe(2);
  });

  it('filtra por faixa de idade e por valor de mercado', async () => {
    const ages = await api().get('/api/v1/players?min_age=18&max_age=25');
    expect(ages.body.meta.total_items).toBe(2);
    const values = await api().get('/api/v1/players?min_value=39.99&max_value=40');
    expect(
      values.body.data.every((player: { market_value: number }) => player.market_value <= 40),
    ).toBe(true);
  });

  it.each([
    'position=mei',
    'position=',
    'free=TRUE',
    'min_age=30&max_age=20',
    'min_value=10&max_value=5',
    'sort=POSITION',
    'sort=value_asc,value_desc',
    'sort=name,age_asc,age_desc',
    'page=0',
    'page=01',
    'limit=51',
    'limit=1.5',
    'min_value=-1',
    'max_value=10,5',
    'search=a',
    'search=',
    'page=1&page=2',
    'free=true&club_id=1',
  ])('recusa o parâmetro %s (400)', async (query) => {
    const response = await api().get(`/api/v1/players?${query}`);
    expect(response.status).toBe(400);
    expect(response.body.message).toBeTruthy();
  });

  it('retorna 404 para clube inexistente no filtro', async () => {
    expect((await api().get('/api/v1/players?club_id=99')).status).toBe(404);
  });

  it('ignora parâmetros desconhecidos', async () => {
    expect((await api().get('/api/v1/players?foo=bar')).status).toBe(200);
  });
});

describe('clubes', () => {
  it('cria clube com 300,00 em caixa e Location (RN10)', async () => {
    const response = await api().post('/api/v1/clubs').send({ name: 'Águias FC', acronym: 'AGU' });
    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/v1/clubs/${response.body.id}`);
    expect(response.body).toMatchObject({
      cash: 300,
      squad_value: 0,
      net_worth: 300,
      acronym: 'AGU',
    });
  });

  it('garante nome único ignorando caixa mas não acentos, e sigla única', async () => {
    await createClub('Águias FC', 'AGU');
    const sameName = await api()
      .post('/api/v1/clubs')
      .send({ name: '  águias   fc ', acronym: 'AFC' });
    expect(sameName.status).toBe(409);
    const withoutAccent = await api()
      .post('/api/v1/clubs')
      .send({ name: 'Aguias FC', acronym: 'AUF' });
    expect(withoutAccent.status).toBe(201);
    const sameAcronym = await api()
      .post('/api/v1/clubs')
      .send({ name: 'Aguerridos Unidos', acronym: 'AGU' });
    expect(sameAcronym.status).toBe(409);
  });

  it.each([
    ['uma palavra só', { name: 'Águias', acronym: 'AGU' }],
    ['seis palavras', { name: 'Um Dois Tres Quatro Cinco Seis', acronym: 'UDT' }],
    ['dígito no nome', { name: 'Águias 2', acronym: 'AGU' }],
    ['sigla em minúsculas', { name: 'Águias FC', acronym: 'agu' }],
    ['sigla que não vem do nome', { name: 'Águias FC', acronym: 'XYZ' }],
    ['sigla que não começa pela inicial', { name: 'Águias FC', acronym: 'GUI' }],
    ['sigla com letras iguais', { name: 'Aaaa Aaaa', acronym: 'AAA' }],
    ['sigla com 2 letras', { name: 'Águias FC', acronym: 'AG' }],
  ])('recusa clube com %s (400)', async (_description, body) => {
    const response = await api().post('/api/v1/clubs').send(body);
    expect(response.status).toBe(400);
  });

  it('limita a liga a 20 clubes', async () => {
    for (let index = 0; index < 20; index += 1) {
      const letter = String.fromCharCode(65 + index);
      await createClub(`Clube ${letter}${letter}`, `CL${letter}`);
    }
    const response = await api()
      .post('/api/v1/clubs')
      .send({ name: 'Clube Extra', acronym: 'CEX' });
    expect(response.status).toBe(409);
    expect((await api().get('/api/v1/clubs')).body).toHaveLength(20);
  });
});

describe('compra e venda (Meia Lua no Águias FC)', () => {
  it('executa o fluxo do enunciado: compra, consulta do clube, venda, histórico e CSV', async () => {
    const { id: playerId } = await createPlayer();
    const { id: clubId } = await createClub();
    await api()
      .patch(`/api/v1/players/${playerId}/condition`)
      .send({ condition: 'MAL_CONDICIONADO' });

    const purchase = await buyPlayer(playerId, clubId);
    expect(purchase.status).toBe(200);
    expect(purchase.body).toMatchObject({
      type: 'COMPRA',
      value: 37,
      fee: 1.85,
      penalty: 0,
      profit: null,
      cash_change: -38.85,
      created_at: '2026-11-02T10:15:00-03:00',
      contract: { purchase_value: 37, loyalty_until: '2027-03-02T10:15:00-03:00', status: 'ATIVO' },
      club_cash: 261.15,
    });

    const club = await api().get(`/api/v1/clubs/${clubId}`);
    expect(club.body).toMatchObject({ cash: 261.15, squad_value: 37, net_worth: 298.15 });
    expect(club.body.players[0].contract).toEqual({
      purchase_value: 37,
      loyalty_until: '2027-03-02T10:15:00-03:00',
      remaining_days: 120,
      penalty_rate: 10,
    });

    await api().patch(`/api/v1/players/${playerId}/condition`).send({ condition: 'APTO' });
    clock.set('2026-11-05T16:40:00-03:00');
    const sale = await api().post(`/api/v1/players/${playerId}/sell`);
    expect(sale.status).toBe(200);
    expect(sale.body).toMatchObject({
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      purchase_value: 37,
      remaining_days: 117,
      penalty_rate: 10,
      contract_status: 'RESCINDIDO',
      club_cash: 296.85,
    });
    expect((await api().get(`/api/v1/players/${playerId}`)).body.club_id).toBeNull();

    const history = await api().get(`/api/v1/clubs/${clubId}/transactions`);
    expect(history.body.data.map((transaction: { type: string }) => transaction.type)).toEqual([
      'VENDA',
      'COMPRA',
    ]);
    expect(history.body.summary).toEqual({
      total_spent: 38.85,
      total_received: 35.7,
      total_fees: 2.15,
      total_penalties: 4,
      total_profit: 3,
    });

    const sales = await api().get(`/api/v1/clubs/${clubId}/transactions?type=VENDA`);
    expect(sales.body.summary).toMatchObject({ total_spent: 0, total_received: 35.7 });

    const csv = await api().get(`/api/v1/clubs/${clubId}/transactions/export`);
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toMatch(/^text\/csv/);
    expect(csv.text).toBe(
      [
        'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa',
        '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70',
        '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85',
        '',
      ].join('\n'),
    );

    const rebuy = await buyPlayer(playerId, clubId);
    expect(rebuy.status).toBe(409);
    const otherClub = await createClub('Delta FC', 'DEL');
    expect((await buyPlayer(playerId, otherClub.id)).status).toBe(200);
  });

  it('recusa compras inválidas sem gravar nada', async () => {
    const { id: playerId } = await createPlayer();
    const { id: clubId } = await createClub();

    const cases: [string, object, number][] = [
      ['data sem fuso', { club_id: clubId, loyalty_until: '2027-03-02T10:15' }, 400],
      ['data inexistente', { club_id: clubId, loyalty_until: '2027-02-30T10:15-03:00' }, 400],
      ['data no passado', { club_id: clubId, loyalty_until: '2026-11-01T10:15-03:00' }, 400],
      [
        'data além de 1.095 dias',
        { club_id: clubId, loyalty_until: '2029-11-01T10:16-03:00' },
        400,
      ],
      ['club_id zero', { club_id: 0, loyalty_until: '2027-03-02T10:15-03:00' }, 400],
      ['club_id ausente', { loyalty_until: '2027-03-02T10:15-03:00' }, 400],
      ['clube inexistente', { club_id: 999, loyalty_until: '2027-03-02T10:15-03:00' }, 404],
    ];
    for (const [, body, status] of cases) {
      const response = await api().post(`/api/v1/players/${playerId}/buy`).send(body);
      expect(response.status).toBe(status);
      expect(response.body.message).toBeTruthy();
    }
    expect((await api().get(`/api/v1/players/${playerId}`)).body.club_id).toBeNull();
    expect((await api().get(`/api/v1/clubs/${clubId}`)).body.cash).toBe(300);
    expect((await buyPlayer(999, clubId)).status).toBe(404);
  });

  it('aceita fidelidade até 1.095 dias depois da compra', async () => {
    const { id: playerId } = await createPlayer();
    const { id: clubId } = await createClub();
    expect((await buyPlayer(playerId, clubId, '2029-11-01T10:15-03:00')).status).toBe(200);
  });

  it('respeita o limite de 50% do caixa e o elenco de 12 jogadores', async () => {
    const { id: clubId } = await createClub();
    const expensive = await createPlayer({
      name: 'Zico Craque',
      position: 'ATA',
      age: 27,
      pace: 99,
      shooting: 99,
      passing: 80,
      dribbling: 99,
      defending: 4,
      physical: 99,
      potential: 99,
    });
    expect(expensive.market_value).toBeGreaterThan(150);
    const refused = await buyPlayer(expensive.id, clubId);
    expect(refused.status).toBe(409);
    expect((await api().get(`/api/v1/clubs/${clubId}`)).body.cash).toBe(300);

    for (let index = 0; index < 12; index += 1) {
      const cheap = await createPlayer({
        name: `Reserva Numero${String.fromCharCode(65 + index)}`,
        position: 'GOL',
        pace: 20,
        shooting: 20,
        passing: 20,
        dribbling: 20,
        defending: 20,
        physical: 20,
        potential: 20,
        age: 27,
      });
      const purchase = await buyPlayer(cheap.id, clubId);
      expect(purchase.status).toBe(200);
    }
    const thirteenth = await createPlayer({
      name: 'Reserva Extra',
      age: 27,
      pace: 20,
      shooting: 20,
      passing: 20,
      dribbling: 20,
      defending: 20,
      physical: 20,
      potential: 20,
    });
    expect((await buyPlayer(thirteenth.id, clubId)).status).toBe(409);
  });

  it('recusa vender jogador livre e jogador excluído', async () => {
    const { id: playerId } = await createPlayer();
    expect((await api().post(`/api/v1/players/${playerId}/sell`)).status).toBe(409);
    await api().delete(`/api/v1/players/${playerId}`);
    expect((await api().post(`/api/v1/players/${playerId}/sell`)).status).toBe(404);
  });

  it('ordena clubes por patrimônio e recusa sort inválido', async () => {
    const rich = await createClub('Águias FC', 'AGU');
    await createClub('Delta FC', 'DEL');
    const { id: playerId } = await createPlayer();
    await buyPlayer(playerId, rich.id);
    const ordered = await api().get('/api/v1/clubs?sort=net_worth_asc');
    expect(ordered.body.map((club: { acronym: string }) => club.acronym)).toEqual(['AGU', 'DEL']);
    expect((await api().get('/api/v1/clubs?sort=net_worth')).status).toBe(400);
  });

  it('filtra o histórico por jogador e recusa jogador excluído', async () => {
    const first = await createPlayer({ name: 'Primeiro Jogador' });
    const second = await createPlayer({ name: 'Segundo Jogador' });
    const { id: clubId } = await createClub();
    await buyPlayer(first.id, clubId);
    await buyPlayer(second.id, clubId);
    await api().post(`/api/v1/players/${second.id}/sell`);
    await api().delete(`/api/v1/players/${second.id}`);

    const filtered = await api().get(`/api/v1/clubs/${clubId}/transactions?player_id=${first.id}`);
    expect(filtered.body.data).toHaveLength(1);
    expect(
      (await api().get(`/api/v1/clubs/${clubId}/transactions?player_id=${second.id}`)).status,
    ).toBe(404);
    expect(
      (await api().get(`/api/v1/clubs/${clubId}/transactions/export?player_id=${second.id}`))
        .status,
    ).toBe(404);
    expect((await api().get(`/api/v1/clubs/${clubId}/transactions?type=COMPRA,venda`)).status).toBe(
      400,
    );
    expect(
      (await api().get(`/api/v1/clubs/${clubId}/transactions?type=COMPRA,COMPRA`)).status,
    ).toBe(400);
    expect((await api().get('/api/v1/clubs/999/transactions')).status).toBe(404);

    const all = await api().get(`/api/v1/clubs/${clubId}/transactions`);
    expect(all.body.data).toHaveLength(3);
    const reconciled =
      300 +
      all.body.data.reduce(
        (sum: number, transaction: { cash_change: number }) => sum + transaction.cash_change,
        0,
      );
    expect((await api().get(`/api/v1/clubs/${clubId}`)).body.cash).toBeCloseTo(reconciled, 2);
  });

  it('exporta CSV com nome com aspas e ponto e vírgula entre aspas duplas', async () => {
    const player = await createPlayer({ name: 'Zé "Foguete" Lima' });
    const { id: clubId } = await createClub();
    await buyPlayer(player.id, clubId);
    const csv = await api().get(`/api/v1/clubs/${clubId}/transactions/export`);
    expect(csv.text.split('\n')[1]).toContain('"Zé ""Foguete"" Lima"');
    const empty = await createClub('Delta FC', 'DEL');
    const emptyCsv = await api().get(`/api/v1/clubs/${empty.id}/transactions/export`);
    expect(emptyCsv.text).toBe(
      'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n',
    );
  });
});
