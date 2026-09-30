import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { appDePrueba, idVendedor } from './ayuda.js';

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

  it('responde 400 si el vendedorId no es un número y 404 si el vendedor no existe', async () => {
    const { app } = appDePrueba();
    const noNumerico = await request(app).get('/api/tenderos').query({ vendedorId: 'abc' });
    expect([noNumerico.status, noNumerico.body]).toEqual([400, { error: 'Falta el vendedor' }]);
    const noExiste = await request(app).get('/api/tenderos').query({ vendedorId: 9999 });
    expect([noExiste.status, noExiste.body]).toEqual([404, { error: 'Vendedor no encontrado' }]);
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

type App = ReturnType<typeof appDePrueba>['app'];

async function leerTendero(app: App, id: number) {
  const res = await request(app).get(`/api/tenderos/${id}`);
  return res.body.tendero;
}

/** PUT hecho por V-101 (vendedorId=1, zona Norte), salvo que la prueba indique otro vendedor. */
function editar(app: App, id: string, query: Record<string, unknown> = { vendedorId: 1 }) {
  return request(app).put(`/api/tenderos/${id}`).query(query);
}

/** Tendero inactivo con valores inventados; se crea en cada prueba y no está en test-data/. */
function crearTenderoInactivo(db: ReturnType<typeof appDePrueba>['db'], zona: string, vendedorId: number, numeroDocumento: string) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO tenderos (tipo_documento, numero_documento, nombre, nombre_tienda, telefono, correo, direccion, zona, vendedor_id, estado)
       VALUES ('DI', ?, 'Inactivo Prueba', 'Tienda Inactiva Prueba', '555-0199', NULL, 'Calle Ficticia 99 n.º 99', ?, ?, 'inactivo')`,
    )
    .run(numeroDocumento, zona, vendedorId);
  return Number(lastInsertRowid);
}

/** Los 5 campos editables (P1 c) tal como los devuelve GET, con los cambios de la prueba. */
async function edicionDe(app: App, id: number, cambios: Record<string, unknown> = {}) {
  const { nombre, nombreTienda, telefono, correo, direccion } = await leerTendero(app, id);
  return { nombre, nombreTienda, telefono, correo, direccion, ...cambios };
}

describe('PUT /api/tenderos/:id', () => {
  it('guarda un teléfono válido (CA2)', async () => {
    const { app } = appDePrueba();
    const res = await editar(app, '1').send(await edicionDe(app, 1, { telefono: '5559876543' }));
    expect(res.status).toBe(200);
    expect(res.body.tendero.telefono).toBe('5559876543');
    expect((await leerTendero(app, 1)).telefono).toBe('5559876543');
  });

  it('agrega un correo al tendero 3 (CA3)', async () => {
    const { app, db } = appDePrueba();
    const res = await editar(app, '3').send(await edicionDe(app, 3, { correo: 'tendero3@ejemplo.test' }));
    expect(res.status).toBe(200);
    expect(db.prepare('SELECT correo FROM tenderos WHERE id = ?').get(3)).toEqual({ correo: 'tendero3@ejemplo.test' });
  });

  it('rechaza un teléfono con letras y no cambia el tendero (CA4, CA13)', async () => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const res = await editar(app, '1').send(await edicionDe(app, 1, { telefono: '555-ABC-1234' }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'El teléfono solo puede tener números.' });
    expect(await leerTendero(app, 1)).toEqual(antes);
    expect(antes.telefono).toBe('555-0101');
  });

  it('rechaza un correo inválido con el mismo cuerpo que el formulario (CA5, CA13)', async () => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const res = await editar(app, '1').send(await edicionDe(app, 1, { correo: 'esquina.ejemplo.test' }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'El correo no es válido.' });
    expect(await leerTendero(app, 1)).toEqual(antes);
  });

  it('guarda 555 123 4567 como se escribió (CA6)', async () => {
    const { app } = appDePrueba();
    const res = await editar(app, '1').send(await edicionDe(app, 1, { telefono: '555 123 4567' }));
    expect(res.status).toBe(200);
    expect((await leerTendero(app, 1)).telefono).toBe('555 123 4567');
  });

  it.each(['555', '5551234567890123'])('rechaza el teléfono %s y no lo cambia (CA6)', async (telefono) => {
    const { app } = appDePrueba();
    const res = await editar(app, '1').send(await edicionDe(app, 1, { telefono }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'El teléfono debe tener de 7 a 10 dígitos.' });
    expect((await leerTendero(app, 1)).telefono).toBe('555-0101');
  });

  it('el teléfono vacío del tendero 4 es obligatorio (CA7)', async () => {
    const { app } = appDePrueba();
    const res = await editar(app, '4').send(await edicionDe(app, 4, { telefono: '' }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'El teléfono es obligatorio.' });
    expect((await leerTendero(app, 4)).telefono).toBeNull();
  });

  it('un correo vacío borra el correo guardado (CA7)', async () => {
    const { app, db } = appDePrueba();
    const conCorreo = await editar(app, '1').send(await edicionDe(app, 1, { correo: 'esquina@ejemplo.test' }));
    expect(conCorreo.status).toBe(200);
    expect(conCorreo.body.tendero.correo).toBe('esquina@ejemplo.test');
    const res = await editar(app, '1').send(await edicionDe(app, 1, { correo: '' }));
    expect(res.status).toBe(200);
    expect(db.prepare('SELECT correo FROM tenderos WHERE id = ?').get(1)).toEqual({ correo: null });
  });

  it('quita los espacios de los extremos del correo y conserva las mayúsculas (CA8)', async () => {
    const { app, db } = appDePrueba();
    const res = await editar(app, '3').send(await edicionDe(app, 3, { correo: ' Tendero3@Ejemplo.TEST ' }));
    expect(res.status).toBe(200);
    expect(db.prepare('SELECT correo FROM tenderos WHERE id = ?').get(3)).toEqual({ correo: 'Tendero3@Ejemplo.TEST' });
  });

  it('responde 404 con el id 9999 (CA10)', async () => {
    const { app } = appDePrueba();
    const res = await editar(app, '9999').send(await edicionDe(app, 1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No encontramos este tendero.' });
  });

  it('responde 400 con el id abc (CA11)', async () => {
    const { app } = appDePrueba();
    const res = await editar(app, 'abc').send(await edicionDe(app, 1));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'El id del tendero debe ser un número.' });
  });

  it('rechaza un cuerpo con solo zona y estado (CA12)', async () => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const res = await editar(app, '1').send({ zona: 'Sur', estado: 'inactivo' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Revisa los datos del tendero.' });
    expect(await leerTendero(app, 1)).toEqual(antes);
    expect(antes.zona).toBe('Norte');
  });

  it('rechaza un cuerpo válido con zona, estado y documento, y no cambia nada (CA12)', async () => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const cuerpo = await edicionDe(app, 1, {
      telefono: '5559876543',
      zona: 'Sur',
      estado: 'inactivo',
      tipoDocumento: 'RT',
      numeroDocumento: '999123456-1',
    });
    const res = await editar(app, '1').send(cuerpo);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Revisa los datos del tendero.' });
    expect(await leerTendero(app, 1)).toEqual(antes);
  });

  it("guarda exactamente el nombre D'Luis (CA14)", async () => {
    const { app } = appDePrueba();
    const res = await editar(app, '1').send(await edicionDe(app, 1, { nombre: "D'Luis" }));
    expect(res.status).toBe(200);
    expect((await leerTendero(app, 1)).nombre).toBe("D'Luis");
  });

  it.each([
    ['CA15', 'RT', '999123456-2'],
    ['CA19', 'DI', '999100274'],
    ['CA20', 'RT', '999123456-1'],
  ])('el documento no se edita: %s responde 400 y el documento no cambia', async (_criterio, tipoDocumento, numeroDocumento) => {
    const { app } = appDePrueba();
    const res = await editar(app, '1').send(await edicionDe(app, 1, { tipoDocumento, numeroDocumento }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Revisa los datos del tendero.' });
    const tendero = await leerTendero(app, 1);
    expect([tendero.tipoDocumento, tendero.numeroDocumento]).toEqual(['DI', '999100137']);
  });

  it('los 5 campos válidos más solo numeroDocumento responden 400 y el tendero no cambia (P1 c)', async () => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const res = await editar(app, '1').send(await edicionDe(app, 1, { numeroDocumento: '999123456-1' }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Revisa los datos del tendero.' });
    expect(await leerTendero(app, 1)).toEqual(antes);
  });

  it('un JSON mal formado responde 400 sin detalle interno', async () => {
    const { app } = appDePrueba();
    const res = await editar(app, '1').set('Content-Type', 'application/json').send('{mal');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Revisa los datos del tendero.' });
  });

  it('no edita un tendero de otra zona (CA9)', async () => {
    const { app } = appDePrueba();
    const vendedorId = await idVendedor(app, 'V-101');
    const antes = await leerTendero(app, 7);
    expect(antes.nombreTienda).toBe('Minimercado Los Pinos');
    const res = await editar(app, '7', { vendedorId }).send({ telefono: '5551112222' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Este tendero no es de tu zona.' });
    expect(await leerTendero(app, 7)).toEqual(antes);
  });

  it('no edita un tendero activo de otra zona aunque el cuerpo sea válido (CA9)', async () => {
    const { app, db } = appDePrueba();
    const vendedorId = await idVendedor(app, 'V-101');
    const antes = db.prepare('SELECT * FROM tenderos WHERE id = ?').get(7);
    const res = await editar(app, '7', { vendedorId }).send(await edicionDe(app, 7, { telefono: '5551112222' }));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Este tendero no es de tu zona.' });
    expect(db.prepare('SELECT * FROM tenderos WHERE id = ?').get(7)).toEqual(antes);
  });

  it('no edita un tendero inactivo de la zona (CA16)', async () => {
    const { app, db } = appDePrueba();
    const id = crearTenderoInactivo(db, 'Norte', 1, '999199001');
    const antes = db.prepare('SELECT * FROM tenderos WHERE id = ?').get(id);
    const res = await editar(app, String(id)).send(await edicionDe(app, id, { telefono: '5559876543' }));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Este tendero está inactivo y no se puede editar.' });
    expect(db.prepare('SELECT * FROM tenderos WHERE id = ?').get(id)).toEqual(antes);
  });

  it('un tendero inactivo de otra zona responde 403', async () => {
    const { app, db } = appDePrueba();
    const id = crearTenderoInactivo(db, 'Sur', 2, '999199002');
    const res = await editar(app, String(id)).send(await edicionDe(app, id));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Este tendero no es de tu zona.' });
  });

  it.each([
    ['sin vendedorId', {}],
    ['vendedorId no numérico', { vendedorId: 'abc' }],
    ['vendedorId que no existe', { vendedorId: 9999 }],
  ])('%s responde 400 y el tendero no cambia', async (_caso, query) => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const res = await editar(app, '1', query).send(await edicionDe(app, 1, { telefono: '5559876543' }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Falta el vendedor.' });
    expect(await leerTendero(app, 1)).toEqual(antes);
  });

  it('comprueba el id antes que el vendedor, y el vendedor antes que la existencia del tendero', async () => {
    const { app } = appDePrueba();
    expect((await editar(app, 'abc', {}).send({})).body).toEqual({ error: 'El id del tendero debe ser un número.' });
    expect((await editar(app, '9999', {}).send({})).body).toEqual({ error: 'Falta el vendedor.' });
  });

  it('guardar sin cambios responde 200 y deja los datos iguales (CA17)', async () => {
    const { app } = appDePrueba();
    const antes = await leerTendero(app, 1);
    const res = await editar(app, '1').send(await edicionDe(app, 1));
    expect(res.status).toBe(200);
    expect(res.body.tendero).toEqual(antes);
    expect(await leerTendero(app, 1)).toEqual(antes);
  });
});
