import { Router } from 'express';
import type { BaseDeDatos } from '../db.js';

export function rutasCatalogo(db: BaseDeDatos) {
  const router = Router();
  router.get('/', (req, res) => {
    const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined;
    const productos = categoria
      ? db.prepare('SELECT id, sku, nombre, categoria, presentacion FROM productos WHERE categoria = ? ORDER BY nombre').all(categoria)
      : db.prepare('SELECT id, sku, nombre, categoria, presentacion FROM productos ORDER BY categoria, nombre').all();
    res.json({ productos });
  });
  return router;
}
