import { Router } from 'express';
import { z } from 'zod';
import type { BaseDeDatos } from '../db.js';

const esquemaSesion = z.object({ codigoVendedor: z.string().trim().min(1) });

/** Sesión simulada: el vendedor entra con su código. No hay contraseñas en este repositorio de práctica. */
export function rutasSesion(db: BaseDeDatos) {
  const router = Router();
  router.post('/', (req, res) => {
    const datos = esquemaSesion.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: 'Falta el código del vendedor' });
      return;
    }
    const vendedor = db
      .prepare('SELECT id, codigo, nombre, zona FROM vendedores WHERE codigo = ?')
      .get(datos.data.codigoVendedor);
    if (!vendedor) {
      res.status(401).json({ error: 'Código de vendedor no reconocido' });
      return;
    }
    res.json({ vendedor });
  });
  return router;
}
