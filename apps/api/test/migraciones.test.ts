import { describe, expect, it } from 'vitest';
import { abrirBaseDeDatos } from '../src/db.js';
import { cargarDatosDePrueba } from '../src/seed.js';

function baseConDatos() {
  const db = abrirBaseDeDatos(':memory:');
  cargarDatosDePrueba(db);
  return db;
}

function insertarTendero(db: ReturnType<typeof baseConDatos>, tipoDocumento: string, numeroDocumento: string) {
  db.prepare(
    `INSERT INTO tenderos (tipo_documento, numero_documento, nombre, nombre_tienda, telefono, correo, direccion, zona, vendedor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(tipoDocumento, numeroDocumento, 'Prueba Norte', 'Tienda Prueba Norte', '5550000001', 'prueba@ejemplo.test', 'Dirección de prueba 1', 'Norte', 1);
}

describe('migraciones', () => {
  it('aplica 002 y los datos de test-data/ cargan sin error', () => {
    const db = baseConDatos();
    const nombres = (db.prepare('SELECT nombre FROM migraciones').all() as { nombre: string }[]).map((m) => m.nombre);
    expect(nombres).toContain('002_tenderos_documento_unico.sql');
  });

  it('impide repetir tipo y número de documento (CA13, CA17)', () => {
    const db = baseConDatos();
    insertarTendero(db, 'DI', '999123456');
    expect(() => insertarTendero(db, 'DI', '999123456')).toThrow(/UNIQUE constraint failed/);
  });

  it('admite el mismo número con otro tipo (CA14)', () => {
    const db = baseConDatos();
    insertarTendero(db, 'DI', '999123456');
    expect(() => insertarTendero(db, 'PA', '999123456')).not.toThrow();
  });
});
