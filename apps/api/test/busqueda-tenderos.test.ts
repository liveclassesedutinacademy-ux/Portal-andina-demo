import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { appDePrueba, idVendedor } from './ayuda.js';
import { comparable } from '../src/validaciones/busqueda.js';

// HU-103 · búsqueda por nombre de tienda en GET /api/tenderos?buscar= (P1). Datos de prueba de la historia
// (backlog-sprint-1.md:58) y de test-data/: V-101 es de la zona Norte y V-102 de la zona Sur.

type App = ReturnType<typeof appDePrueba>['app'];

async function buscar(app: App, codigoVendedor: string, texto?: string) {
  const vendedorId = await idVendedor(app, codigoVendedor);
  return request(app).get('/api/tenderos').query(texto === undefined ? { vendedorId } : { vendedorId, buscar: texto });
}

const tiendas = (res: request.Response) => res.body.tenderos.map((t: { nombreTienda: string }) => t.nombreTienda);

const ZONA_NORTE = ['Autoservicio La 20', 'Minimercado El Roble', 'Tienda Doña Rosa', 'Tienda El Parque', 'Tienda La Esquina'];

describe('comparable (P2)', () => {
  it('pasa a minúsculas y quita tildes, diéresis y la marca de la ñ', () => {
    expect(comparable('Tienda San JOSÉ')).toBe('tienda san jose');
    expect(comparable('Pingüino')).toBe('pinguino');
    expect(comparable('Doña Rosa')).toBe('dona rosa');
  });
});

describe('GET /api/tenderos?buscar= (HU-103)', () => {
  it('CA2: con 3 o más caracteres devuelve solo las tiendas que contienen el texto', async () => {
    const { app } = appDePrueba();
    const res = await buscar(app, 'V-101', 'esq');
    expect(res.status).toBe(200);
    expect(tiendas(res)).toEqual(['Tienda La Esquina']);
  });

  it('CA2: no distingue mayúsculas ni minúsculas', async () => {
    const { app } = appDePrueba();
    expect(tiendas(await buscar(app, 'V-101', 'ROBLE'))).toEqual(['Minimercado El Roble']);
    expect(tiendas(await buscar(app, 'V-101', 'eSqUiNa'))).toEqual(['Tienda La Esquina']);
  });

  it('CA2: no distingue tildes, ni en el nombre de la tienda ni en el texto buscado', async () => {
    const { app } = appDePrueba();
    expect(tiendas(await buscar(app, 'V-102', 'jose'))).toEqual(['Tienda San José']);
    expect(tiendas(await buscar(app, 'V-101', 'ésquína'))).toEqual(['Tienda La Esquina']);
  });

  it('CA2 y P2: «dona» encuentra «Tienda Doña Rosa» (la ñ se compara como n)', async () => {
    const { app } = appDePrueba();
    expect(tiendas(await buscar(app, 'V-101', 'dona'))).toEqual(['Tienda Doña Rosa']);
  });

  it('CA2: el texto puede estar en cualquier parte del nombre y devuelve todas las que lo contienen', async () => {
    const { app } = appDePrueba();
    expect(tiendas(await buscar(app, 'V-101', 'tienda'))).toEqual(['Tienda Doña Rosa', 'Tienda El Parque', 'Tienda La Esquina']);
    expect(tiendas(await buscar(app, 'V-101', 'la e'))).toEqual(['Tienda La Esquina']);
  });

  it('CA3: sin buscar, vacío o con 1 o 2 caracteres devuelve la lista completa de la zona', async () => {
    const { app } = appDePrueba();
    for (const texto of [undefined, '', 'e', 'es']) {
      const res = await buscar(app, 'V-101', texto);
      expect(res.status).toBe(200);
      expect(tiendas(res)).toEqual(ZONA_NORTE);
    }
  });

  it('CA3 y P3: los espacios de los extremos no cuentan', async () => {
    const { app } = appDePrueba();
    expect(tiendas(await buscar(app, 'V-101', '   '))).toEqual(ZONA_NORTE);
    expect(tiendas(await buscar(app, 'V-101', '  es  '))).toEqual(ZONA_NORTE);
    expect(tiendas(await buscar(app, 'V-101', '  esq  '))).toEqual(['Tienda La Esquina']);
  });

  it('CA4: si ninguna tienda coincide, responde 200 con la lista vacía', async () => {
    const { app } = appDePrueba();
    const res = await buscar(app, 'V-101', 'xyz');
    expect([res.status, res.body]).toEqual([200, { tenderos: [] }]);
  });

  it('CA5: solo busca en la zona del vendedor («pinos» es de la zona Sur)', async () => {
    const { app } = appDePrueba();
    expect((await buscar(app, 'V-101', 'pinos')).body).toEqual({ tenderos: [] });
    expect(tiendas(await buscar(app, 'V-102', 'pinos'))).toEqual(['Minimercado Los Pinos']);
  });

  it('PC-14: una tienda inactiva de la misma zona también aparece, igual que en la lista (la historia no lo decide)', async () => {
    const { app, db } = appDePrueba();
    db.prepare(
      `INSERT INTO tenderos (tipo_documento, numero_documento, nombre, nombre_tienda, telefono, correo, direccion, zona, vendedor_id, estado)
       VALUES ('DI', '999555103', 'Inactivo Prueba', 'Tienda Esquinera Prueba', '555-0199', NULL, 'Calle Ficticia 99 n.º 99', 'Norte', ?, 'inactivo')`,
    ).run(await idVendedor(app, 'V-101'));
    expect(tiendas(await buscar(app, 'V-101', 'esquin'))).toEqual(['Tienda Esquinera Prueba', 'Tienda La Esquina']);
  });

  it('trata el texto como datos: una comilla o un comodín de SQL no rompen la consulta', async () => {
    const { app } = appDePrueba();
    for (const texto of ["D'Luis", '%%%', '___', "' OR 1=1 --"]) {
      expect(await buscar(app, 'V-101', texto).then((r) => [r.status, r.body])).toEqual([200, { tenderos: [] }]);
    }
  });

  it('P4: un buscar repetido responde 400 con el mensaje general', async () => {
    const { app } = appDePrueba();
    const vendedorId = await idVendedor(app, 'V-101');
    const res = await request(app).get(`/api/tenderos?vendedorId=${vendedorId}&buscar=esq&buscar=roble`);
    expect([res.status, res.body]).toEqual([400, { error: 'Revisa los datos del tendero.' }]);
  });

  it('sigue pidiendo el vendedor antes de buscar', async () => {
    const { app } = appDePrueba();
    const sinVendedor = await request(app).get('/api/tenderos').query({ buscar: 'esq' });
    expect([sinVendedor.status, sinVendedor.body]).toEqual([400, { error: 'Falta el vendedor' }]);
    const noExiste = await request(app).get('/api/tenderos').query({ vendedorId: 9999, buscar: 'esq' });
    expect([noExiste.status, noExiste.body]).toEqual([404, { error: 'Vendedor no encontrado' }]);
  });
});
