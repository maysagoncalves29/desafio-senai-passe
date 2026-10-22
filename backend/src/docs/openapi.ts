import { CONDITIONS, FORMATIONS, POSITIONS } from '../domain/types.js';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonContent = (schema: object) => ({ 'application/json': { schema } });
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

const errorResponses = {
  400: { description: 'Dado, formato ou parâmetro inválido', content: jsonContent(ref('Error')) },
  404: { description: 'Recurso inexistente', content: jsonContent(ref('Error')) },
  409: { description: 'Regra de negócio violada', content: jsonContent(ref('Error')) },
};

function responses(success: object, ...codes: (400 | 404 | 409)[]) {
  return {
    ...success,
    ...Object.fromEntries(codes.map((code) => [code, errorResponses[code]])),
  };
}

const ok = (schema: object, description = 'Sucesso') => ({
  200: { description, content: jsonContent(schema) },
});

const queryParameter = (
  name: string,
  description: string,
  schema: object = { type: 'string' },
) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
});

const bodyOf = (schema: object) => ({
  required: true,
  content: jsonContent(schema),
});

const money = { type: 'number', format: 'double', example: 37.0 };
const integer = { type: 'integer' };
const string = { type: 'string' };

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Passe — API da liga fictícia',
    version: '1.0.0',
    description:
      'Jogadores, clubes, mercado (compra e venda com contrato de fidelidade), escalação, partidas e classificação. Valores em moedas têm 2 casas; datas enviadas usam `AAAA-MM-DDTHH:MM-03:00`.',
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verifica se a API e o banco estão respondendo',
        responses: ok({
          type: 'object',
          properties: { status: { type: 'string', example: 'ok' } },
        }),
      },
    },
    '/players': {
      get: {
        tags: ['Jogadores'],
        summary: 'Lista paginada, com busca, filtros e ordenação (RN07)',
        parameters: [
          queryParameter('search', 'Busca no nome (2 a 100 caracteres), sem diferenciar acentos'),
          queryParameter('position', 'Posição', { type: 'string', enum: POSITIONS }),
          queryParameter('condition', 'Condição física', { type: 'string', enum: CONDITIONS }),
          queryParameter('free', 'true: só livres; false: só com clube', {
            type: 'string',
            enum: ['true', 'false'],
          }),
          queryParameter('club_id', 'Elenco de um clube', integer),
          queryParameter('min_age', 'Idade mínima (16 a 45)', integer),
          queryParameter('max_age', 'Idade máxima (16 a 45)', integer),
          queryParameter('min_value', 'Valor de mercado mínimo (0 a 550)', { type: 'string' }),
          queryParameter('max_value', 'Valor de mercado máximo (0 a 550)', { type: 'string' }),
          queryParameter('sort', 'Até dois critérios separados por vírgula', {
            type: 'string',
            example: 'value_desc,age_asc',
            default: 'name',
          }),
          queryParameter('page', 'Página (padrão 1)', integer),
          queryParameter('limit', 'Itens por página, de 1 a 50 (padrão 10)', integer),
        ],
        responses: responses(ok(ref('PlayerPage')), 400, 404),
      },
      post: {
        tags: ['Jogadores'],
        summary: 'Cadastra um jogador (nasce livre e APTO); calcula o valor base (RN06)',
        requestBody: bodyOf(ref('CreatePlayer')),
        responses: responses(
          { 201: { description: 'Criado', content: jsonContent(ref('Player')) } },
          400,
        ),
      },
    },
    '/players/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Jogadores'],
        summary: 'Detalhes de um jogador',
        responses: responses(ok(ref('Player')), 404),
      },
      put: {
        tags: ['Jogadores'],
        summary: 'Edita nome, posição, agilidade e idade (RN08)',
        requestBody: bodyOf(ref('UpdatePlayer')),
        responses: responses(ok(ref('Player')), 400, 404, 409),
      },
      delete: {
        tags: ['Jogadores'],
        summary: 'Exclusão lógica de jogador livre (RN09)',
        responses: responses({ 204: { description: 'Excluído' } }, 404, 409),
      },
    },
    '/players/{id}/condition': {
      parameters: [idParameter],
      patch: {
        tags: ['Jogadores'],
        summary: 'Altera a condição física',
        requestBody: bodyOf({
          type: 'object',
          required: ['condition'],
          properties: { condition: { type: 'string', enum: CONDITIONS } },
        }),
        responses: responses(ok(ref('Player')), 400, 404, 409),
      },
    },
    '/players/{id}/buy': {
      parameters: [idParameter],
      post: {
        tags: ['Mercado'],
        summary: 'Compra jogador livre e cria o contrato de fidelidade (RN12 a RN14)',
        requestBody: bodyOf({
          type: 'object',
          required: ['club_id', 'loyalty_until'],
          properties: {
            club_id: integer,
            loyalty_until: { type: 'string', example: '2027-03-02T10:15-03:00' },
          },
        }),
        responses: responses(ok(ref('PurchaseResult')), 400, 404, 409),
      },
    },
    '/players/{id}/sell': {
      parameters: [idParameter],
      post: {
        tags: ['Mercado'],
        summary: 'Vende o jogador pelo clube atual, com multa e comissão (RN15 e RN16)',
        responses: responses(ok(ref('SaleResult')), 404, 409),
      },
    },
    '/clubs': {
      get: {
        tags: ['Clubes'],
        summary: 'Lista os clubes',
        parameters: [
          queryParameter('sort', 'Ordenação', {
            type: 'string',
            enum: ['name', 'net_worth_asc', 'net_worth_desc'],
            default: 'name',
          }),
        ],
        responses: responses(ok({ type: 'array', items: ref('Club') }), 400),
      },
      post: {
        tags: ['Clubes'],
        summary: 'Cria um clube com 300,00 em caixa (RN10)',
        requestBody: bodyOf({
          type: 'object',
          required: ['name', 'acronym'],
          properties: {
            name: { ...string, example: 'Águias FC' },
            acronym: { ...string, example: 'AGU' },
          },
        }),
        responses: responses(
          { 201: { description: 'Criado', content: jsonContent(ref('Club')) } },
          400,
          409,
        ),
      },
    },
    '/clubs/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Clubes'],
        summary: 'Clube com elenco, contratos, valor do elenco e patrimônio (RN11)',
        responses: responses(ok(ref('ClubDetail')), 404),
      },
    },
    '/clubs/{id}/transactions': {
      parameters: [idParameter],
      get: {
        tags: ['Mercado'],
        summary: 'Histórico de transações do clube, com totais (RN17)',
        parameters: [
          queryParameter('type', 'COMPRA, VENDA ou COMPRA,VENDA'),
          queryParameter('player_id', 'Só as transações desse jogador', integer),
        ],
        responses: responses(ok(ref('TransactionHistory')), 400, 404),
      },
    },
    '/clubs/{id}/transactions/export': {
      parameters: [idParameter],
      get: {
        tags: ['Mercado'],
        summary: 'Exporta o histórico em CSV (RN18)',
        parameters: [
          queryParameter('type', 'COMPRA, VENDA ou COMPRA,VENDA'),
          queryParameter('player_id', 'Só as transações desse jogador', integer),
        ],
        responses: responses(
          { 200: { description: 'Arquivo CSV', content: { 'text/csv': { schema: string } } } },
          400,
          404,
        ),
      },
    },
    '/clubs/{id}/lineup': {
      parameters: [idParameter],
      get: {
        tags: ['Liga'],
        summary: 'Escalação atual do clube (RN19)',
        responses: responses(ok(ref('Lineup')), 404),
      },
      put: {
        tags: ['Liga'],
        summary: 'Escolhe a formação e escala os 5 titulares (RN19)',
        requestBody: bodyOf({
          type: 'object',
          required: ['formation', 'player_ids'],
          properties: {
            formation: { type: 'string', enum: FORMATIONS },
            player_ids: { type: 'array', items: integer, minItems: 5, maxItems: 5 },
          },
        }),
        responses: responses(ok(ref('Lineup')), 400, 404, 409),
      },
    },
    '/matches': {
      get: {
        tags: ['Liga'],
        summary: 'Histórico de partidas, da mais recente para a mais antiga (RN21)',
        parameters: [queryParameter('club_id', 'Partidas em que o clube jogou', integer)],
        responses: responses(ok({ type: 'array', items: ref('Match') }), 400, 404),
      },
      post: {
        tags: ['Liga'],
        summary: 'Joga uma partida e grava placar, formações e 6 duelos (RN20)',
        requestBody: bodyOf({
          type: 'object',
          required: ['home_club_id', 'away_club_id'],
          properties: { home_club_id: integer, away_club_id: integer },
        }),
        responses: responses(
          { 201: { description: 'Criada', content: jsonContent(ref('MatchDetail')) } },
          400,
          404,
          409,
        ),
      },
    },
    '/matches/{id}': {
      parameters: [idParameter],
      get: {
        tags: ['Liga'],
        summary: 'Partida com os 6 duelos',
        responses: responses(ok(ref('MatchDetail')), 404),
      },
    },
    '/standings': {
      get: {
        tags: ['Liga'],
        summary: 'Classificação de todos os clubes (RN21)',
        responses: ok({ type: 'array', items: ref('Standing') }),
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        required: ['message'],
        properties: { message: string },
      },
      Player: {
        type: 'object',
        properties: {
          id: integer,
          name: string,
          position: { type: 'string', enum: POSITIONS },
          agility: integer,
          age: integer,
          condition: { type: 'string', enum: CONDITIONS },
          base_value: money,
          market_value: money,
          pace: integer,
          shooting: integer,
          passing: integer,
          dribbling: integer,
          defending: integer,
          physical: integer,
          potential: integer,
          overall: integer,
          club_id: { type: 'integer', nullable: true },
        },
      },
      CreatePlayer: {
        type: 'object',
        required: [
          'name',
          'position',
          'agility',
          'age',
          'pace',
          'shooting',
          'passing',
          'dribbling',
          'defending',
          'physical',
          'potential',
        ],
        properties: {
          name: { ...string, example: 'Meia Lua' },
          position: { type: 'string', enum: POSITIONS },
          agility: integer,
          age: integer,
          pace: integer,
          shooting: integer,
          passing: integer,
          dribbling: integer,
          defending: integer,
          physical: integer,
          potential: integer,
        },
      },
      UpdatePlayer: {
        type: 'object',
        required: ['name', 'position', 'agility', 'age'],
        properties: {
          name: string,
          position: { type: 'string', enum: POSITIONS },
          agility: integer,
          age: integer,
        },
      },
      PlayerPage: {
        type: 'object',
        properties: {
          data: { type: 'array', items: ref('Player') },
          meta: {
            type: 'object',
            properties: {
              page: integer,
              limit: integer,
              total_items: integer,
              total_pages: integer,
            },
          },
        },
      },
      Club: {
        type: 'object',
        properties: {
          id: integer,
          name: string,
          acronym: string,
          cash: money,
          squad_value: money,
          net_worth: money,
        },
      },
      Contract: {
        type: 'object',
        properties: {
          purchase_value: money,
          loyalty_until: string,
          remaining_days: integer,
          penalty_rate: integer,
        },
      },
      ClubDetail: {
        allOf: [
          ref('Club'),
          {
            type: 'object',
            properties: {
              players: {
                type: 'array',
                items: {
                  allOf: [
                    ref('Player'),
                    { type: 'object', properties: { contract: ref('Contract') } },
                  ],
                },
              },
            },
          },
        ],
      },
      Transaction: {
        type: 'object',
        properties: {
          id: integer,
          club_id: integer,
          player_id: integer,
          player_name: string,
          type: { type: 'string', enum: ['COMPRA', 'VENDA'] },
          value: money,
          fee: money,
          penalty: money,
          profit: { ...money, nullable: true },
          cash_change: money,
          created_at: string,
        },
      },
      PurchaseResult: {
        allOf: [
          ref('Transaction'),
          {
            type: 'object',
            properties: {
              contract: {
                type: 'object',
                properties: { purchase_value: money, loyalty_until: string, status: string },
              },
              club_cash: money,
            },
          },
        ],
      },
      SaleResult: {
        allOf: [
          ref('Transaction'),
          {
            type: 'object',
            properties: {
              purchase_value: money,
              remaining_days: integer,
              penalty_rate: integer,
              contract_status: { type: 'string', enum: ['ENCERRADO', 'RESCINDIDO'] },
              club_cash: money,
            },
          },
        ],
      },
      TransactionHistory: {
        type: 'object',
        properties: {
          data: { type: 'array', items: ref('Transaction') },
          summary: {
            type: 'object',
            properties: {
              total_spent: money,
              total_received: money,
              total_fees: money,
              total_penalties: money,
              total_profit: money,
            },
          },
        },
      },
      Lineup: {
        type: 'object',
        properties: {
          club_id: integer,
          formation: { type: 'string', nullable: true, enum: [...FORMATIONS, null] },
          complete: { type: 'boolean' },
          players: { type: 'array', items: ref('Player') },
        },
      },
      MatchSide: {
        type: 'object',
        properties: { club_id: integer, club_name: string, formation: string, goals: integer },
      },
      Match: {
        type: 'object',
        properties: {
          id: integer,
          played_at: string,
          home: ref('MatchSide'),
          away: ref('MatchSide'),
          result: { type: 'string', enum: ['MANDANTE', 'VISITANTE', 'EMPATE'] },
        },
      },
      DuelParticipant: {
        type: 'object',
        properties: {
          player_id: integer,
          player_name: string,
          position: string,
          condition: string,
          attribute: string,
          value: integer,
        },
      },
      MatchDetail: {
        allOf: [
          ref('Match'),
          {
            type: 'object',
            properties: {
              duels: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    order: integer,
                    attacking_club_id: integer,
                    attacker: ref('DuelParticipant'),
                    defender: ref('DuelParticipant'),
                    goal: { type: 'boolean' },
                  },
                },
              },
            },
          },
        ],
      },
      Standing: {
        type: 'object',
        properties: {
          position: integer,
          club_id: integer,
          club_name: string,
          played: integer,
          wins: integer,
          draws: integer,
          losses: integer,
          goals_for: integer,
          goals_against: integer,
          goal_difference: integer,
          points: integer,
        },
      },
    },
  },
};
