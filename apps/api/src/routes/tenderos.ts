import { Router } from 'express';
import type { BaseDeDatos } from '../db.js';

const COLUMNAS = `id, tipo_documento AS tipoDocumento, numero_documento AS numeroDocumento, nombre,
  nombre_tienda AS nombreTienda, telefono, correo, direccion, zona, vendedor_id AS vendedorId, estado`;

export function rutasTenderos(db: BaseDeDatos) {
  const router = Router();

  // Tenderos de la zona del vendedor.
  router.get('/', (req, res) => {
    const vendedorId = Number(req.query.vendedorId);
    if (!Number.isInteger(vendedorId) || vendedorId <= 0) {
      res.status(400).json({ error: 'Falta el vendedor' });
      return;
    }
    const vendedor = db.prepare('SELECT zona FROM vendedores WHERE id = ?').get(vendedorId) as { zona: string } | undefined;
    if (!vendedor) {
      res.status(404).json({ error: 'Vendedor no encontrado' });
      return;
    }
    const tenderos = db.prepare(`SELECT ${COLUMNAS} FROM tenderos WHERE zona = ? ORDER BY nombre_tienda`).all(vendedor.zona);
    res.json({ tenderos });
  });

  router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Identificador inválido' });
      return;
    }
    const tendero = db.prepare(`SELECT ${COLUMNAS} FROM tenderos WHERE id = ?`).get(id);
    if (!tendero) {
      res.status(404).json({ error: 'Tendero no encontrado' });
      return;
    }
    res.json({ tendero });
  });

  return router;
}
