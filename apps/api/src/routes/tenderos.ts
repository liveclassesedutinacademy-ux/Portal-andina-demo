import { Router } from 'express';
import { z } from 'zod';
import type { BaseDeDatos } from '../db.js';

const COLUMNAS = `id, tipo_documento AS tipoDocumento, numero_documento AS numeroDocumento, nombre,
  nombre_tienda AS nombreTienda, telefono, correo, direccion, zona, vendedor_id AS vendedorId, estado`;

const CAMPOS_EDITABLES: Record<string, string> = {
  nombre: 'nombre',
  nombreTienda: 'nombre_tienda',
  telefono: 'telefono',
  correo: 'correo',
  direccion: 'direccion',
};

const esquemaEdicion = z
  .object({
    nombre: z.string().trim().min(2).max(80),
    nombreTienda: z.string().trim().min(2).max(80),
    telefono: z.string().trim().regex(/^[0-9 +-]{7,15}$/, 'Teléfono inválido').nullable(),
    correo: z.email('Correo inválido').nullable(),
    direccion: z.string().trim().min(5).max(120),
  })
  .partial()
  .strict();

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

  // Edición de los datos de contacto del tendero (HU-102).
  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Identificador inválido' });
      return;
    }
    const datos = esquemaEdicion.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: datos.error.issues[0]?.message ?? 'Datos inválidos' });
      return;
    }
    const existe = db.prepare('SELECT id FROM tenderos WHERE id = ?').get(id);
    if (!existe) {
      res.status(404).json({ error: 'Tendero no encontrado' });
      return;
    }
    const cambios = Object.entries(datos.data)
      .map(([campo, valor]) => `${CAMPOS_EDITABLES[campo]} = ${valor === null ? 'NULL' : `'${valor}'`}`)
      .join(', ');
    if (cambios) db.exec(`UPDATE tenderos SET ${cambios} WHERE id = ${id}`);
    const tendero = db.prepare(`SELECT ${COLUMNAS} FROM tenderos WHERE id = ?`).get(id);
    res.json({ tendero });
  });

  return router;
}
