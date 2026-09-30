import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { appDePrueba } from './ayuda.js';

describe('POST /api/sesion', () => {
  it('reconoce a un vendedor por su código', async () => {
    const { app } = appDePrueba();
    const res = await request(app).post('/api/sesion').send({ codigoVendedor: 'V-101' });
    expect(res.status).toBe(200);
    expect(res.body.vendedor).toMatchObject({ codigo: 'V-101', zona: 'Norte' });
  });

  it('rechaza un código que no existe', async () => {
    const { app } = appDePrueba();
    const res = await request(app).post('/api/sesion').send({ codigoVendedor: 'V-999' });
    expect(res.status).toBe(401);
  });

  it('pide el código cuando falta', async () => {
    const { app } = appDePrueba();
    const res = await request(app).post('/api/sesion').send({});
    expect(res.status).toBe(400);
  });
});
