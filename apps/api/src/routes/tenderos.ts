import { Router } from 'express';
import type { BaseDeDatos } from '../db.js';
import { esquemaEdicionTendero, esquemaRegistroTendero, primerError } from '../validaciones/tendero.js';

const COLUMNAS = `id, tipo_documento AS tipoDocumento, numero_documento AS numeroDocumento, nombre,
  nombre_tienda AS nombreTienda, telefono, correo, direccion, zona, vendedor_id AS vendedorId, estado`;

const MENSAJE_DUPLICADO = 'Este tendero ya está registrado.';
const MENSAJE_DUPLICADO_INACTIVO = 'Este tendero ya está registrado y está inactivo. Comunícate con la oficina comercial.';

/** SQLITE_CONSTRAINT_UNIQUE: lo produce el índice tenderos_documento_unico (migración 002). */
const esDocumentoRepetido = (err: unknown) =>
  err instanceof Error && ((err as { errcode?: number }).errcode === 2067 || err.message.includes('UNIQUE constraint failed'));

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

  // Registro de un tendero (HU-101). La zona y el estado los fija el servidor (PT2).
  router.post('/', (req, res) => {
    const resultado = esquemaRegistroTendero.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: primerError(resultado) });
      return;
    }
    const datos = resultado.data;
    const vendedor = db.prepare('SELECT zona FROM vendedores WHERE id = ?').get(datos.vendedorId) as { zona: string } | undefined;
    if (!vendedor) {
      res.status(404).json({ error: 'Vendedor no encontrado.' });
      return;
    }
    // Sin consulta previa: el índice único es la única fuente de verdad, también ante un doble envío (CA17).
    let lastInsertRowid: number | bigint;
    try {
      ({ lastInsertRowid } = db
        .prepare(
          `INSERT INTO tenderos (tipo_documento, numero_documento, nombre, nombre_tienda, telefono, correo, direccion, zona, vendedor_id, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
        )
        .run(
          datos.tipoDocumento,
          datos.numeroDocumento,
          datos.nombre,
          datos.nombreTienda,
          datos.telefono,
          datos.correo,
          datos.direccion,
          vendedor.zona,
          datos.vendedorId,
        ));
    } catch (err) {
      if (!esDocumentoRepetido(err)) throw err;
      const existente = db
        .prepare('SELECT estado, zona FROM tenderos WHERE tipo_documento = ? AND numero_documento = ?')
        .get(datos.tipoDocumento, datos.numeroDocumento) as { estado: string; zona: string } | undefined;
      // Solo se revela que está inactivo si es de la zona del vendedor (P4 a, P5 c, D5).
      const inactivoEnLaZona = existente?.estado === 'inactivo' && existente.zona === vendedor.zona;
      res.status(409).json({ error: inactivoEnLaZona ? MENSAJE_DUPLICADO_INACTIVO : MENSAJE_DUPLICADO });
      return;
    }
    const tendero = db.prepare(`SELECT ${COLUMNAS} FROM tenderos WHERE id = ?`).get(lastInsertRowid);
    res.status(201).json({ tendero });
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

  // Edición de los datos de un tendero (HU-102). Solo cambian los 5 campos editables (P1 c).
  router.put('/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'El id del tendero debe ser un número.' });
      return;
    }
    const existe = db.prepare('SELECT id FROM tenderos WHERE id = ?').get(id);
    if (!existe) {
      res.status(404).json({ error: 'No encontramos este tendero.' });
      return;
    }
    const resultado = esquemaEdicionTendero.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: primerError(resultado) });
      return;
    }
    const datos = resultado.data;
    db.prepare('UPDATE tenderos SET nombre = ?, nombre_tienda = ?, telefono = ?, correo = ?, direccion = ? WHERE id = ?').run(
      datos.nombre,
      datos.nombreTienda,
      datos.telefono,
      datos.correo,
      datos.direccion,
      id,
    );
    const tendero = db.prepare(`SELECT ${COLUMNAS} FROM tenderos WHERE id = ?`).get(id);
    res.json({ tendero });
  });

  return router;
}
