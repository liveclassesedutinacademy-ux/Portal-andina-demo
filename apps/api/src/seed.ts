import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BaseDeDatos } from './db.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const carpetaDatos = join(aqui, '..', '..', '..', 'test-data');

function leer<T>(archivo: string): T {
  return JSON.parse(readFileSync(join(carpetaDatos, archivo), 'utf8')) as T;
}

/** Carga los datos sintéticos de test-data/ (generados por test-data/generar.mjs). */
export function cargarDatosDePrueba(db: BaseDeDatos): void {
  const vendedores = leer<{ id: number; codigo: string; nombre: string; zona: string }[]>('vendedores.json');
  const productos = leer<{ id: number; sku: string; nombre: string; categoria: string; presentacion: string }[]>('productos.json');
  const tenderos = leer<Record<string, string | number | null>[]>('tenderos.json');

  const insVendedor = db.prepare('INSERT INTO vendedores (id, codigo, nombre, zona) VALUES (?, ?, ?, ?)');
  for (const v of vendedores) insVendedor.run(v.id, v.codigo, v.nombre, v.zona);

  const insProducto = db.prepare('INSERT INTO productos (id, sku, nombre, categoria, presentacion) VALUES (?, ?, ?, ?, ?)');
  for (const p of productos) insProducto.run(p.id, p.sku, p.nombre, p.categoria, p.presentacion);

  const insTendero = db.prepare(
    `INSERT INTO tenderos (id, tipo_documento, numero_documento, nombre, nombre_tienda, telefono, correo, direccion, zona, vendedor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const t of tenderos) {
    insTendero.run(t.id, t.tipoDocumento, t.numeroDocumento, t.nombre, t.nombreTienda, t.telefono, t.correo, t.direccion, t.zona, t.vendedorId);
  }
}
