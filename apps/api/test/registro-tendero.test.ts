import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { appDePrueba, datosBase, idVendedor } from './ayuda.js';
import { MENSAJES } from '../src/validaciones/tendero.js';

type Prueba = ReturnType<typeof appDePrueba>;

/** App nueva con V-101 como vendedor por defecto, según las condiciones de la historia. */
async function preparar() {
  const prueba = appDePrueba();
  return { ...prueba, v101: await idVendedor(prueba.app, 'V-101') };
}

function registrar({ app }: Prueba, cuerpo: Record<string, unknown>) {
  return request(app).post('/api/tenderos').send(cuerpo);
}

/** Datos válidos base con el vendedor y el documento indicados. */
const con = (vendedorId: number, tipoDocumento: string, numeroDocumento: string, extra: Record<string, unknown> = {}) => ({
  vendedorId,
  tipoDocumento,
  numeroDocumento,
  ...datosBase(extra),
});

function filaDe({ db }: Prueba, tipoDocumento: string, numeroDocumento: string) {
  return db
    .prepare('SELECT * FROM tenderos WHERE tipo_documento = ? AND numero_documento = ?')
    .get(tipoDocumento, numeroDocumento) as Record<string, unknown> | undefined;
}

const contarTenderos = ({ db }: Prueba) => (db.prepare('SELECT COUNT(*) AS n FROM tenderos').get() as { n: number }).n;

describe('POST /api/tenderos: registro válido', () => {
  it('CA1: crea el tendero con la zona del vendedor, su id y estado activo', async () => {
    const p = await preparar();
    const res = await registrar(p, con(p.v101, 'DI', '999123456'));
    expect(res.status).toBe(201);
    expect(res.body.tendero).toMatchObject({ tipoDocumento: 'DI', numeroDocumento: '999123456', zona: 'Norte', vendedorId: p.v101, estado: 'activo' });
    expect(filaDe(p, 'DI', '999123456')).toMatchObject({ zona: 'Norte', vendedor_id: p.v101, estado: 'activo' });
  });

  it('CA2: aparece en la lista de V-101 y no en la de V-102', async () => {
    const p = await preparar();
    const v102 = await idVendedor(p.app, 'V-102');
    await registrar(p, con(p.v101, 'DI', '999123456'));
    const tiendas = async (vendedorId: number) =>
      (await request(p.app).get('/api/tenderos').query({ vendedorId })).body.tenderos.map((t: { nombreTienda: string }) => t.nombreTienda);
    expect(await tiendas(p.v101)).toContain('Tienda Prueba Norte');
    expect(await tiendas(v102)).not.toContain('Tienda Prueba Norte');
  });

  it('CA3: ignora la zona y el estado que llegan en el cuerpo', async () => {
    const p = await preparar();
    const res = await registrar(p, con(p.v101, 'DI', '999124005', { zona: 'Sur', estado: 'inactivo' }));
    expect(res.status).toBe(201);
    expect(filaDe(p, 'DI', '999124005')).toMatchObject({ zona: 'Norte', estado: 'activo' });
  });

  it.each([
    ['CA4', 'DI', '999123'],
    ['CA4', 'DI', '9991234567'],
    ['CA6', 'RT', '999123456-1'],
    ['CA6', 'RT', '999000013-0'],
    ['CA6', 'RT', '999000005-0'],
    ['CA9', 'PA', '999ABC'],
    ['CA9', 'PA', '999ABCDEF'],
  ])('%s: acepta %s %s', async (_ca, tipo, numero) => {
    const p = await preparar();
    const res = await registrar(p, con(p.v101, tipo, numero));
    expect(res.status).toBe(201);
    expect(filaDe(p, tipo, numero)).toBeDefined();
  });

  it.each([
    ['CA11', 'PA', '999abc', '999ABC'],
    ['CA12', 'DI', '999.124.001', '999124001'],
    ['CA12', 'RT', '999 000 024-4', '999000024-4'],
  ])('%s: guarda %s %s normalizado', async (_ca, tipo, numero, guardado) => {
    const p = await preparar();
    const res = await registrar(p, con(p.v101, tipo, numero));
    expect(res.status).toBe(201);
    expect(res.body.tendero.numeroDocumento).toBe(guardado);
    expect(filaDe(p, tipo, guardado)).toBeDefined();
  });

  it('CA14: acepta el mismo número con otro tipo de documento', async () => {
    const p = await preparar();
    await registrar(p, con(p.v101, 'DI', '999123456'));
    const res = await registrar(p, con(p.v101, 'PA', '999123456'));
    expect(res.status).toBe(201);
  });

  it("CA23: guarda D'Luis idéntico", async () => {
    const p = await preparar();
    const res = await registrar(p, con(p.v101, 'DI', '999124004', { nombre: "D'Luis" }));
    expect(res.status).toBe(201);
    expect(filaDe(p, 'DI', '999124004')).toMatchObject({ nombre: "D'Luis" });
  });

  it('D2 y P2: guarda los textos sin los espacios de los extremos y el teléfono como se escribió', async () => {
    const p = await preparar();
    const res = await registrar(p, con(p.v101, 'DI', '999124002', { nombre: '  Prueba Norte  ', telefono: '555-0101' }));
    expect(res.status).toBe(201);
    expect(filaDe(p, 'DI', '999124002')).toMatchObject({ nombre: 'Prueba Norte', telefono: '555-0101' });
  });

  it('D4: guarda como nulo un correo vacío o ausente', async () => {
    const p = await preparar();
    await registrar(p, con(p.v101, 'DI', '999124002', { correo: '   ' }));
    const { correo: _correo, ...sinCorreo } = con(p.v101, 'DI', '999124003');
    await registrar(p, sinCorreo);
    expect(filaDe(p, 'DI', '999124002')).toMatchObject({ correo: null });
    expect(filaDe(p, 'DI', '999124003')).toMatchObject({ correo: null });
  });
});

describe('POST /api/tenderos: errores de validación', () => {
  const DI = 'El documento de identidad debe tener de 6 a 10 dígitos.';
  const RT = 'El registro tributario no es válido.';
  const PA = 'El pasaporte debe tener de 6 a 9 letras mayúsculas o dígitos.';

  it.each([
    ['CA5', 'DI', '99912', DI],
    ['CA5', 'DI', '99912345678', DI],
    ['CA5', 'DI', '99912A', DI],
    ['CA7', 'RT', '999123456-2', RT],
    ['CA7', 'RT', '99912345-6', RT],
    ['CA8', 'RT', '9991234561', RT],
    ['CA10', 'PA', '999AB', PA],
    ['CA10', 'PA', '999ABCDEFG', PA],
    ['CA10', 'PA', '999ÁBC', PA],
    ['CA10', 'PA', '999AB-C', PA],
  ])('%s: rechaza %s %s con su mensaje y no crea nada', async (_ca, tipo, numero, mensaje) => {
    const p = await preparar();
    const antes = contarTenderos(p);
    const res = await registrar(p, con(p.v101, tipo, numero));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: mensaje });
    expect(contarTenderos(p)).toBe(antes);
  });

  it('CA21: la API valida sin el formulario (DI 99912)', async () => {
    const p = await preparar();
    const antes = contarTenderos(p);
    const res = await request(p.app).post('/api/tenderos').set('Content-Type', 'application/json').send(JSON.stringify(con(p.v101, 'DI', '99912')));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: DI });
    expect(contarTenderos(p)).toBe(antes);
  });

  it.each([
    ['CA18', { nombreTienda: '   ' }, '999124007', 'El nombre de la tienda es obligatorio.'],
    ['CA19', { telefono: 'abc' }, '999124008', 'El teléfono debe tener de 7 a 10 dígitos.'],
    ['CA20', { correo: 'sin-arroba' }, '999124009', 'El correo no es válido.'],
  ])('%s: responde 400 con el mensaje aprobado y no crea nada', async (_ca, extra, numero, mensaje) => {
    const p = await preparar();
    const antes = contarTenderos(p);
    const res = await registrar(p, con(p.v101, 'DI', numero, extra));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: mensaje });
    expect(contarTenderos(p)).toBe(antes);
  });

  it('CA24: responde 404 si el vendedor no existe y no crea nada', async () => {
    const p = await preparar();
    const antes = contarTenderos(p);
    const res = await registrar(p, con(9999, 'DI', '999124010'));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Vendedor no encontrado.' });
    expect(contarTenderos(p)).toBe(antes);
  });

  it('PT4: valida el cuerpo antes de buscar el vendedor', async () => {
    const p = await preparar();
    const res = await registrar(p, con(9999, 'DI', '99912'));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: DI });
  });

  it.each([
    ['cuerpo vacío', {}],
    ['vendedorId que no es número', { vendedorId: 'abc' }],
  ])('no devuelve mensajes por defecto de zod: %s', async (_caso, cuerpo) => {
    const p = await preparar();
    const res = await registrar(p, cuerpo);
    expect(res.status).toBe(400);
    expect(Object.keys(res.body)).toEqual(['error']);
    expect(MENSAJES).toContain(res.body.error);
  });
});
