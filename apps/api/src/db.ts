import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const carpetaMigraciones = join(aqui, '..', 'migrations');

export type BaseDeDatos = DatabaseSync;

/** Abre la base de datos y aplica las migraciones pendientes. Usa ':memory:' en las pruebas. */
export function abrirBaseDeDatos(ruta: string): BaseDeDatos {
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY)');
  const aplicadas = new Set(
    (db.prepare('SELECT nombre FROM migraciones').all() as { nombre: string }[]).map((m) => m.nombre),
  );
  for (const archivo of readdirSync(carpetaMigraciones).filter((f) => f.endsWith('.sql')).sort()) {
    if (aplicadas.has(archivo)) continue;
    db.exec(readFileSync(join(carpetaMigraciones, archivo), 'utf8'));
    db.prepare('INSERT INTO migraciones (nombre) VALUES (?)').run(archivo);
  }
  return db;
}
