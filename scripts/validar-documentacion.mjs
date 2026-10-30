#!/usr/bin/env node
/**
 * Validación de la documentación del Portal Andina.
 *
 * Comprueba siete cosas que se rompen solas cuando el código cambia y la
 * documentación no. No revisa la redacción: revisa que lo que la documentación
 * afirma siga existiendo en el código.
 *
 *   C1 · Citas         Toda cita `archivo:línea` de docs/ apunta a un archivo que existe
 *                      y a una línea que existe.
 *   C2 · Endpoints     Toda ruta registrada en apps/api/src/routes está en la tabla de
 *                      endpoints de docs/contexto-del-portal.md.
 *   C3 · Mensajes      Todo mensaje de error literal de la API aparece en algún documento.
 *   C4 · Decisiones    Todo ADR de docs/decisiones está en el índice del README.
 *   C5 · Migraciones   Toda migración de apps/api/migrations se menciona en docs/.
 *   C6 · Parámetros    Todo `req.query.<nombre>` que lea la API está en la tabla de
 *                      endpoints de docs/contexto-del-portal.md.
 *   C7 · Rutas web     Toda ruta de apps/web/src/App.tsx está documentada en docs/.
 *
 * Uso:  node scripts/validar-documentacion.mjs [--json]
 * Sale con código 1 si hay algún incumplimiento.
 *
 * Distribuidora Andina y Nodo Software son empresas ficticias.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';

const RAIZ = process.cwd();
const EXT_CODIGO = new Set(['.ts', '.tsx', '.sql', '.mjs', '.js', '.json', '.md', '.yml']);
const CARPETAS_IGNORADAS = new Set(['node_modules', '.git', 'dist', 'test-results', 'playwright-report', 'capturas']);

function archivos(dir, acc = []) {
  for (const entrada of readdirSync(dir)) {
    if (CARPETAS_IGNORADAS.has(entrada)) continue;
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) archivos(ruta, acc);
    else acc.push(ruta);
  }
  return acc;
}

const TODOS = archivos(RAIZ);
const DOCS = TODOS.filter((f) => relative(RAIZ, f).startsWith('docs') && f.endsWith('.md'));
const lineas = new Map();
function cuentaLineas(ruta) {
  if (!lineas.has(ruta)) lineas.set(ruta, readFileSync(ruta, 'utf8').split('\n').length);
  return lineas.get(ruta);
}

/** Índice de nombres de archivo → rutas, para resolver citas que no traen la ruta completa. */
const porNombre = new Map();
for (const f of TODOS) {
  if (!EXT_CODIGO.has(extname(f))) continue;
  const n = basename(f);
  if (!porNombre.has(n)) porNombre.set(n, []);
  porNombre.get(n).push(f);
}

const fallos = [];
const avisos = [];
function fallo(check, documento, mensaje) {
  fallos.push({ check, documento, mensaje });
}

// ─── C1 · Citas archivo:línea ────────────────────────────────────────────────
// Reconoce `archivo.ext:12`, `archivo.ext:12-20` y `ruta/al/archivo.ext:12`.
const RE_CITA = /([\w./-]+\.(?:ts|tsx|sql|mjs|js|md|yml))[:·]\s?(\d+)(?:\s?[-–]\s?(\d+))?/g;

for (const doc of DOCS) {
  const texto = readFileSync(doc, 'utf8');
  const rel = relative(RAIZ, doc);
  for (const m of texto.matchAll(RE_CITA)) {
    const [, citado, desdeTxt, hastaTxt] = m;
    const desde = Number(desdeTxt);
    const hasta = hastaTxt ? Number(hastaTxt) : desde;
    let candidatos;
    if (citado.includes('/')) {
      // Ruta completa desde la raíz, o un trozo final de ruta (`validaciones/tendero.ts`).
      const directo = join(RAIZ, citado);
      candidatos = existsSync(directo)
        ? [directo]
        : TODOS.filter((f) => relative(RAIZ, f).endsWith(citado));
    } else {
      candidatos = porNombre.get(citado) ?? [];
    }
    if (candidatos.length === 0) {
      fallo('C1', rel, `cita a un archivo que no existe: ${citado}:${desdeTxt}`);
      continue;
    }
    if (candidatos.length > 1) {
      avisos.push({ check: 'C1', documento: rel, mensaje: `cita ambigua (${candidatos.length} archivos se llaman ${citado}): ${citado}:${desdeTxt}` });
      continue;
    }
    const total = cuentaLineas(candidatos[0]);
    if (hasta > total) {
      fallo('C1', rel, `cita ${citado}:${desdeTxt}${hastaTxt ? '-' + hastaTxt : ''} y el archivo tiene ${total} líneas`);
    }
  }
}

// ─── C2 · Endpoints de la API en la tabla del contexto ───────────────────────
const CONTEXTO = join(RAIZ, 'docs/contexto-del-portal.md');
const RUTAS_API = TODOS.filter((f) => relative(RAIZ, f).startsWith(join('apps', 'api', 'src', 'routes')) && f.endsWith('.ts'));
const PREFIJOS = { 'tenderos.ts': '/api/tenderos', 'catalogo.ts': '/api/catalogo', 'sesion.ts': '/api/sesion' };

if (!existsSync(CONTEXTO)) {
  fallo('C2', 'docs/contexto-del-portal.md', 'no existe el documento de contexto con la tabla de endpoints');
} else {
  const contexto = readFileSync(CONTEXTO, 'utf8');
  for (const archivo of RUTAS_API) {
    const n = basename(archivo);
    const prefijo = PREFIJOS[n];
    if (!prefijo) {
      avisos.push({ check: 'C2', documento: relative(RAIZ, archivo), mensaje: `no hay prefijo declarado para ${n} en el script; agrégalo a PREFIJOS` });
      continue;
    }
    const texto = readFileSync(archivo, 'utf8');
    for (const m of texto.matchAll(/router\.(get|post|put|patch|delete)\(\s*'([^']*)'/g)) {
      const verbo = m[1].toUpperCase();
      const sufijo = m[2] === '/' ? '' : m[2];
      const ruta = (prefijo + sufijo).replace(/\/:(\w+)/g, '/:$1');
      const patron = new RegExp(`${verbo}[^\\n|]*\`?${ruta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
      if (!patron.test(contexto)) {
        fallo('C2', 'docs/contexto-del-portal.md', `falta en la tabla de endpoints: ${verbo} ${ruta} (${relative(RAIZ, archivo)})`);
      }
    }
  }
}

const textoDocs = DOCS.map((f) => readFileSync(f, 'utf8')).join('\n');

// ─── C6 · Parámetros de consulta documentados ────────────────────────────────
// Todo `req.query.<nombre>` que lea la API tiene que estar en la tabla de endpoints.
if (existsSync(CONTEXTO)) {
  const contexto = readFileSync(CONTEXTO, 'utf8');
  for (const archivo of RUTAS_API) {
    const texto = readFileSync(archivo, 'utf8');
    const vistos = new Set();
    for (const m of texto.matchAll(/req\.query\.(\w+)/g)) vistos.add(m[1]);
    for (const m of texto.matchAll(/req\.query\[['"](\w+)['"]\]/g)) vistos.add(m[1]);
    for (const parametro of vistos) {
      if (!contexto.includes(`${parametro}=`)) {
        fallo('C6', 'docs/contexto-del-portal.md', `parámetro de consulta sin documentar: ?${parametro}= (${relative(RAIZ, archivo)})`);
      }
    }
  }
}

// ─── C7 · Rutas de la web documentadas ───────────────────────────────────────
const APP_WEB = join(RAIZ, 'apps/web/src/App.tsx');
if (existsSync(APP_WEB)) {
  const texto = readFileSync(APP_WEB, 'utf8');
  for (const m of texto.matchAll(/<Route\s+path=["']([^"']+)["']/g)) {
    const ruta = m[1];
    if (ruta === '*') continue;
    const normalizada = ruta.startsWith('/') ? ruta : '/' + ruta;
    if (!textoDocs.includes(normalizada)) {
      fallo('C7', 'docs/', `ruta de la web sin documentar: ${normalizada} (apps/web/src/App.tsx)`);
    }
  }
}

// ─── C3 · Mensajes de error de la API documentados ───────────────────────────
const mensajes = new Set();
for (const archivo of TODOS.filter((f) => relative(RAIZ, f).startsWith(join('apps', 'api', 'src')) && f.endsWith('.ts'))) {
  const texto = readFileSync(archivo, 'utf8');
  for (const m of texto.matchAll(/error:\s*'([^']{6,})'/g)) mensajes.add(m[1]);
}
for (const mensaje of mensajes) {
  if (!textoDocs.includes(mensaje)) {
    fallo('C3', 'docs/', `mensaje de error de la API que no está en ningún documento: «${mensaje}»`);
  }
}

// ─── C4 · ADR en el índice ───────────────────────────────────────────────────
const DIR_ADR = join(RAIZ, 'docs/decisiones');
if (existsSync(DIR_ADR)) {
  const indice = existsSync(join(DIR_ADR, 'README.md')) ? readFileSync(join(DIR_ADR, 'README.md'), 'utf8') : null;
  if (indice === null) {
    fallo('C4', 'docs/decisiones/README.md', 'hay ADR pero no existe el índice');
  } else {
    for (const f of readdirSync(DIR_ADR).filter((f) => /^\d{4}-.+\.md$/.test(f))) {
      if (!indice.includes(f)) fallo('C4', 'docs/decisiones/README.md', `el ADR ${f} no está en el índice`);
    }
  }
}

// ─── C5 · Migraciones mencionadas ────────────────────────────────────────────
const DIR_MIG = join(RAIZ, 'apps/api/migrations');
if (existsSync(DIR_MIG)) {
  for (const f of readdirSync(DIR_MIG).filter((f) => f.endsWith('.sql'))) {
    if (!textoDocs.includes(f)) fallo('C5', 'docs/', `la migración ${f} no se menciona en ningún documento`);
  }
}

// ─── Salida ──────────────────────────────────────────────────────────────────
const resumen = {
  documentos: DOCS.length,
  fallos: fallos.length,
  avisos: avisos.length,
  porCheck: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'].map((c) => ({ check: c, fallos: fallos.filter((f) => f.check === c).length })),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ resumen, fallos, avisos }, null, 2));
} else {
  const nombres = {
    C1: 'Citas archivo:línea',
    C2: 'Endpoints en la tabla del contexto',
    C3: 'Mensajes de error documentados',
    C4: 'ADR en el índice',
    C5: 'Migraciones mencionadas',
    C6: 'Parámetros de consulta documentados',
    C7: 'Rutas de la web documentadas',
  };
  console.log(`Validación de documentación · ${DOCS.length} documentos revisados\n`);
  for (const { check, fallos: n } of resumen.porCheck) {
    console.log(`  ${n === 0 ? '✓' : '✗'} ${check} · ${nombres[check]}${n ? `: ${n} incumplimiento(s)` : ''}`);
  }
  if (fallos.length) {
    console.log('\nIncumplimientos:');
    for (const f of fallos) console.log(`  [${f.check}] ${f.documento}: ${f.mensaje}`);
  }
  if (avisos.length) {
    console.log('\nAvisos (no detienen el pipeline):');
    for (const a of avisos) console.log(`  [${a.check}] ${a.documento}: ${a.mensaje}`);
  }
  console.log(
    fallos.length
      ? `\nLa documentación no está al día: ${fallos.length} incumplimiento(s). Actualiza los documentos en el mismo pull request del cambio.`
      : '\nLa documentación está al día.',
  );
}

process.exit(fallos.length ? 1 : 0);
