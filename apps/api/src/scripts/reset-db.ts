import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirBaseDeDatos } from '../db.js';
import { cargarDatosDePrueba } from '../seed.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const ruta = process.env.PORTAL_DB ?? join(aqui, '..', '..', 'data', 'portal.db');
rmSync(ruta, { force: true });
const db = abrirBaseDeDatos(ruta);
cargarDatosDePrueba(db);
console.log(`Base de datos reiniciada con los datos de test-data/: ${ruta}`);
