import { abrirBaseDeDatos } from '../src/db.js';
import { cargarDatosDePrueba } from '../src/seed.js';
import { crearApp } from '../src/app.js';

/** App con una base en memoria y los datos sintéticos de test-data/. */
export function appDePrueba() {
  const db = abrirBaseDeDatos(':memory:');
  cargarDatosDePrueba(db);
  return { app: crearApp(db), db };
}
