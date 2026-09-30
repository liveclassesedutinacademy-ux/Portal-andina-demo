import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearApp } from './app.js';
import { abrirBaseDeDatos } from './db.js';
import { cargarDatosDePrueba } from './seed.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const rutaBase = process.env.PORTAL_DB ?? join(aqui, '..', 'data', 'portal.db');
const puerto = Number(process.env.PORT ?? 3001);

const db = abrirBaseDeDatos(rutaBase);
const hayDatos = (db.prepare('SELECT COUNT(*) AS n FROM vendedores').get() as { n: number }).n > 0;
if (!hayDatos) cargarDatosDePrueba(db);

crearApp(db).listen(puerto, () => {
  console.log(`API del Portal Andina en http://localhost:${puerto}`);
});
