import express, { type NextFunction, type Request, type Response } from 'express';
import type { BaseDeDatos } from './db.js';
import { rutasSesion } from './routes/sesion.js';
import { rutasCatalogo } from './routes/catalogo.js';
import { rutasTenderos } from './routes/tenderos.js';

export function crearApp(db: BaseDeDatos) {
  const app = express();
  app.use(express.json());

  app.get('/api/salud', (_req, res) => {
    res.json({ estado: 'ok' });
  });
  app.use('/api/sesion', rutasSesion(db));
  app.use('/api/catalogo', rutasCatalogo(db));
  app.use('/api/tenderos', rutasTenderos(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  // Manejo de errores: nunca se devuelve el detalle interno al cliente.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  });

  return app;
}
