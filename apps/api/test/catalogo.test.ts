import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { appDePrueba } from './ayuda.js';

describe('GET /api/catalogo', () => {
  it('devuelve el catálogo completo', async () => {
    const { app } = appDePrueba();
    const res = await request(app).get('/api/catalogo');
    expect(res.status).toBe(200);
    expect(res.body.productos.length).toBe(12);
  });

  it('filtra por categoría', async () => {
    const { app } = appDePrueba();
    const res = await request(app).get('/api/catalogo').query({ categoria: 'Aseo' });
    expect(res.status).toBe(200);
    expect(res.body.productos.length).toBeGreaterThan(0);
    for (const p of res.body.productos) expect(p.categoria).toBe('Aseo');
  });
});
