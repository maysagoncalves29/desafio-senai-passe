import { describe, expect, it } from 'vitest';
import { api } from './helpers.js';

describe('saúde da API', () => {
  it('responde ok quando o banco está acessível', async () => {
    const response = await api().get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('expõe a documentação OpenAPI com os endpoints', async () => {
    const response = await api().get('/docs/openapi.json');
    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining(['/players', '/clubs/{id}/transactions/export', '/standings']),
    );
  });
});
