import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { appDePrueba } from './ayuda.js';

describe('GET /api/tenderos', () => {
  it('lista solo los tenderos de la zona del vendedor', async () => {
    const { app } = appDePrueba();
    const res = await request(app).get('/api/tenderos').query({ vendedorId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.tenderos.length).toBeGreaterThan(0);
    for (const t of res.body.tenderos) expect(t.zona).toBe('Norte');
  });

  it('pide el vendedor', async () => {
    const { app } = appDePrueba();
    const res = await request(app).get('/api/tenderos');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/tenderos/:id', () => {
  it('devuelve un tendero', async () => {
    const { app } = appDePrueba();
    const res = await request(app).get('/api/tenderos/1');
    expect(res.status).toBe(200);
    expect(res.body.tendero.numeroDocumento.startsWith('999')).toBe(true);
  });

  it('responde 404 si no existe', async () => {
    const { app } = appDePrueba();
    const res = await request(app).get('/api/tenderos/9999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tenderos/:id', () => {
  it('actualiza el teléfono y el correo', async () => {
    const { app } = appDePrueba();
    const res = await request(app).put('/api/tenderos/1').send({ telefono: '555-0199', correo: 'nuevo@ejemplo.test' });
    expect(res.status).toBe(200);
    expect(res.body.tendero.telefono).toBe('555-0199');
    expect(res.body.tendero.correo).toBe('nuevo@ejemplo.test');
  });

  it('permite borrar el correo', async () => {
    const { app } = appDePrueba();
    const res = await request(app).put('/api/tenderos/1').send({ correo: null });
    expect(res.status).toBe(200);
    expect(res.body.tendero.correo).toBeNull();
  });

  it('rechaza un correo inválido', async () => {
    const { app } = appDePrueba();
    const res = await request(app).put('/api/tenderos/1').send({ correo: 'sin-arroba' });
    expect(res.status).toBe(400);
  });

  it('no permite cambiar el documento', async () => {
    const { app } = appDePrueba();
    const res = await request(app).put('/api/tenderos/1').send({ numeroDocumento: '999000000' });
    expect(res.status).toBe(400);
  });

  it('responde 404 si el tendero no existe', async () => {
    const { app } = appDePrueba();
    const res = await request(app).put('/api/tenderos/9999').send({ telefono: '555-0199' });
    expect(res.status).toBe(404);
  });
});
