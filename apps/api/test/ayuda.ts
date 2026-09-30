import request from 'supertest';
import { abrirBaseDeDatos } from '../src/db.js';
import { cargarDatosDePrueba } from '../src/seed.js';
import { crearApp } from '../src/app.js';

/** App con una base en memoria y los datos sintéticos de test-data/. */
export function appDePrueba() {
  const db = abrirBaseDeDatos(':memory:');
  cargarDatosDePrueba(db);
  return { app: crearApp(db), db };
}

/** Id del vendedor, obtenido con POST /api/sesion como pide la historia HU-101. */
export async function idVendedor(app: ReturnType<typeof crearApp>, codigoVendedor: string): Promise<number> {
  const res = await request(app).post('/api/sesion').send({ codigoVendedor });
  return res.body.vendedor.id;
}

/** Datos válidos base de la historia HU-101, sin vendedor ni documento. */
export function datosBase(extra: Record<string, unknown> = {}) {
  return {
    nombre: 'Prueba Norte',
    nombreTienda: 'Tienda Prueba Norte',
    telefono: '5550000001',
    correo: 'prueba@ejemplo.test',
    direccion: 'Dirección de prueba 1',
    ...extra,
  };
}
