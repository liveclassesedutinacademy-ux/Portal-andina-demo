# HU-103 · Búsqueda de tenderos por nombre de tienda · descripción del pull request

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este documento son inventados (salen de `test-data/`).

## (1) Qué cambia y por qué

1. La lista de tenderos tiene un campo «Buscar tienda» para que el vendedor encuentre rápido la tienda que visita (HU-103, `docs/historias/backlog-sprint-1.md:47-60`).
2. `GET /api/tenderos` acepta `?buscar=`: con 3 o más caracteres devuelve solo las tiendas de la zona cuyo nombre contiene el texto, sin distinguir mayúsculas ni tildes (`apps/api/src/routes/tenderos.ts:43-52`).
3. Con menos de 3 caracteres o el campo vacío se ve la lista completa; sin coincidencias, «No hay tiendas con ese nombre en tu zona» (`apps/web/src/pages/Tenderos.tsx:19, 63`).
4. El filtro va en la API, dentro de la consulta por zona y con parámetros `?`, para que la regla viva en un solo lugar y se pruebe con Supertest (propuesta P1).
5. Las reglas que la historia no fija (ñ, espacios, frecuencia de llamadas, parámetro repetido) quedan como propuestas pendientes de aprobación (sección 6).

## (2) Criterios de aceptación

La última columna dice si la prueba fallaría al quitar el cambio del código (revertir `tenderos.ts`, `Tenderos.tsx` y `api.ts`).

| # | Criterio (`backlog-sprint-1.md`) | Prueba que lo comprueba | Estado |
|---|---|---|---|
| CA1 | En la lista hay un campo «Buscar tienda» (`:52`) | e2e `e2e/busqueda-tenderos.spec.ts:31-35`; componente `apps/web/test/BusquedaTenderos.test.tsx:56-61` | Cumple. Las dos fallan sin el cambio |
| CA2 | Con 3 o más caracteres, solo las tiendas cuyo nombre contiene el texto, sin distinguir mayúsculas, minúsculas ni tildes (`:53`) | e2e `busqueda-tenderos.spec.ts:37-47` («esq», «ROBLE», «dona», «ésq») y `:75-79` («jose» → «Tienda San José»); API `apps/api/test/busqueda-tenderos.test.ts:29-57`; componente `BusquedaTenderos.test.tsx:63-90` (solo qué envía la web y qué muestra; la comparación la simula) | Cumple. Todas fallan sin el cambio. Que la ñ cuente como n depende de la propuesta P2 |
| CA3 | Con menos de 3 caracteres o vacío, la lista completa de la zona (`:54`) | e2e `busqueda-tenderos.spec.ts:49-60` («es», «e» y vacío: están las 5 tiendas del Norte y ninguna de otra zona); API `busqueda-tenderos.test.ts:59-73`; componente `BusquedaTenderos.test.tsx:92-130` | Cumple. El e2e y el componente fallan sin el cambio; **las de la API no**, porque la API ya devolvía la lista completa. Que los espacios de los extremos no cuenten depende de P3 y no tiene e2e |
| CA4 | Sin coincidencias, «No hay tiendas con ese nombre en tu zona» (`:55`) | e2e `busqueda-tenderos.spec.ts:63-67`; API `busqueda-tenderos.test.ts:75-79` (lista vacía); componente `BusquedaTenderos.test.tsx:132-156` | Cumple. Todas fallan sin el cambio |
| CA5 | La búsqueda solo recorre la zona del vendedor (`:56`) | e2e `busqueda-tenderos.spec.ts:63-73` («pinos»: nada para V-101, «Minimercado Los Pinos» para V-102); API `busqueda-tenderos.test.ts:81-85` | Cumple con un ejemplo («pinos»), con el límite de PC-03 (riesgo 1). Las dos fallan sin el cambio y también si se quita `zona = ?` de la consulta de búsqueda |
| Datos de prueba | «esq» → «Tienda La Esquina»; «ROBLE» → «Minimercado El Roble»; «pinos» → nada con V-101 (`:58`) | e2e `busqueda-tenderos.spec.ts:37-41, 63-67`; API `busqueda-tenderos.test.ts:31-38, 83` | Cumple |

Pruebas del cambio que no comprueban un criterio, porque prueban una propuesta: `busqueda-tenderos.test.ts:87-94` (inactivos, PC-14), `:103-108` (P4), `:110-116` (orden de las comprobaciones) y `BusquedaTenderos.test.tsx:158-186` (P5).

## (3) Documentación actualizada

Rama `hu-103-busqueda-tenderos`, sobre `main` en `8b6cc7f`, un commit por paso. Cada commit que cambia comportamiento lleva su documentación, incluida la salida real de las pruebas de ese paso.

| Commit | Documento | Sección | Por qué el cambio de código la afectaba |
|---|---|---|---|
| `decbe29` (paso 1) | `docs/planes/HU-103-decisiones-propuestas.md` | Nuevo | Las decisiones abiertas de la historia, con su porqué y su estado, antes del código |
| `81ecef9` (paso 2, API) | `docs/contexto-del-portal.md` | §4, tabla de endpoints (`:56`) | `GET /api/tenderos` lee un parámetro nuevo, `buscar`, y tiene un 400 nuevo. Las reglas de P2, P3 y P4 se marcan como propuestas. Sin esta fila, C6 falla (sección 5) |
| `81ecef9` | `docs/modulos/tenderos.md` | Encabezado y §1 (`:5`, `:13`) | El documento decía describir el commit `6913486`; ahora describe también la rama de HU-103 |
| `81ecef9` | `docs/modulos/tenderos.md` | §3.1, fila `GET /api/tenderos` (`:97`) | Nueva entrada (`buscar`), nueva salida filtrada y nuevo error |
| `81ecef9` | `docs/modulos/tenderos.md` | §4, reglas R27 a R30 (`:163-166`) | Reglas nuevas de la API, cada una con dónde se aplica y la propuesta de la que sale, marcada **pendiente de aprobación** |
| `81ecef9` | `docs/modulos/tenderos.md` | §8, PC-14 y PC-16 (`:345`, `:347`) | La búsqueda también devuelve inactivos (PC-14); `buscar` sí se valida con zod (PC-16) |
| `81ecef9` | `docs/modulos/tenderos.md` | §6 y §7 | Archivo de pruebas nuevo, salida real del paso y fila de estado «parcial» |
| `81ecef9` | `docs/modulos/tenderos.md` | Citas a `tenderos.ts` en todo el documento | `tenderos.ts` creció: las líneas 4 a 30 se movieron 1, las 32 a 39 se movieron 3 y desde la 41 se movieron 12. Las citas viejas apuntaban a líneas que existen pero dicen otra cosa, y C1 no lo detecta (sección 5). Las moví con un script fuera del repositorio y revisé el diff cita por cita |
| `0cea52c` (paso 3, web) | `docs/contexto-del-portal.md` | §3, módulos (`:29`) | El portal tiene una funcionalidad más. Ningún control lo exige |
| `0cea52c` | `docs/modulos/tenderos.md` | §3.3, pantalla `/tenderos` (`:127`); R31 (`:167`); R25; citas a `Tenderos.tsx` | La pantalla tiene el campo, el mensaje de CA4 y llama a la API con `&buscar=`; `Tenderos.tsx` se reorganizó |
| `0cea52c` | `docs/modulos/tenderos.md` | §6 y §7 | Archivo de pruebas nuevo, salida real del paso y fila de estado «parcial» |
| `b85d1c8` (paso 4, e2e) | `docs/modulos/tenderos.md` | §6 (`:230`, `:234`), §7 (`:306-309`), Dudas (`:364`) | e2e nuevo. «Hecho» solo para lo que recorre el e2e (CA1 a CA5); P3, P4 y P5 quedan «parcial» porque solo las cubren pruebas de API o de componente |
| `b85d1c8` | `docs/contexto-del-portal.md` | §3, módulos (`:29`) | El estado pasa de «en construcción» a «hecho en la rama» |
| (paso 5) | Este archivo | — | Descripción del PR |

En `main`, `docs/modulos/tenderos.md` tenía 52 citas a `tenderos.ts` y `Tenderos.tsx` más 6 citas cortas (`:N`) en la fila del PUT, y este cambio las desplazó todas. `apps/web/src/lib/api.ts` se cambió en la misma línea 49, sin agregar líneas, para no desplazar las citas de `api.ts` que hay en el ADR 0001, la auditoría y los PR anteriores.

## (4) Salida real

Corridas del 30-10-2026 (Node v22.23.4): `npm test`, `npm run lint` y `npm run test:e2e` sobre el código de `b85d1c8`, que no cambia en el paso 5; `npm run docs:validar` con este archivo ya escrito, porque sus citas también las revisa C1.

`npm run docs:validar`:

```
> docs:validar
> node scripts/validar-documentacion.mjs

Validación de documentación · 24 documentos revisados

  ✓ C1 · Citas archivo:línea
  ✓ C2 · Endpoints en la tabla del contexto
  ✓ C3 · Mensajes de error documentados
  ✓ C4 · ADR en el índice
  ✓ C5 · Migraciones mencionadas
  ✓ C6 · Parámetros de consulta documentados
  ✓ C7 · Rutas de la web documentadas

La documentación está al día.
```

`npm test`:

```
> test
> npm test -w apps/api && npm test -w apps/web

> test
> vitest run

 RUN  v5.0.2 …/portal-andina/apps/api

 Test Files  8 passed (8)
      Tests  240 passed (240)
   Start at  15:15:29
   Duration  427ms (import 48%, transform 30%, tests 21%, worker 1%)

> test
> vitest run

 RUN  v5.0.2 …/portal-andina/apps/web

 Test Files  4 passed (4)
      Tests  25 passed (25)
   Start at  15:15:29
   Duration  2.49s (tests 50%, environment 32%, import 7%, transform 5%, setup 5%)
```

Antes: 226 de la API y 15 de la web. Se agregan 14 (`busqueda-tenderos.test.ts`) y 10 (`BusquedaTenderos.test.tsx`).

`npm run lint` (`tsc` no imprime nada cuando pasa):

```
> lint
> npm run lint -w apps/api && npm run lint -w apps/web

> lint
> tsc --noEmit

> lint
> tsc --noEmit
```

`npm run test:e2e`:

```
> test:e2e
> playwright test

Running 7 tests using 3 workers

  ✓  1 [chromium] › e2e/navegacion.spec.ts:3:5 › el vendedor ingresa, consulta el catálogo y ve los tenderos de su zona (719ms)
  ✓  2 [chromium] › e2e/busqueda-tenderos.spec.ts:31:5 › CA1 a CA3: V-101 busca por nombre de tienda sin distinguir mayúsculas ni tildes (873ms)
  ✓  3 [chromium] › e2e/registro-tendero.spec.ts:28:5 › CA25 y CA2: registra un tendero y vuelve a la lista con «Tendero registrado» (928ms)
  ✓  4 [chromium] › e2e/navegacion.spec.ts:19:5 › un código de vendedor desconocido muestra un error (260ms)
  ✓  5 [chromium] › e2e/busqueda-tenderos.spec.ts:63:5 › CA4 y CA5: «pinos» no devuelve nada para V-101 (es de la zona Sur) y sí para V-102 (544ms)
  ✓  6 [chromium] › e2e/registro-tendero.spec.ts:40:5 › CA22 y CA13: un DI repetido con puntos muestra el mensaje y conserva lo escrito (770ms)
  ✓  7 [chromium] › e2e/busqueda-tenderos.spec.ts:75:5 › CA2: V-102 encuentra «Tienda San José» escribiendo «jose», sin tilde (311ms)

  7 passed (3.8s)
```

Comprobaciones adicionales: una mutación en `Tenderos.tsx` (quitar el descarte de respuestas viejas) hizo fallar «P5: descarta la respuesta de un texto que ya cambió», y se revirtió. No pude comprobar si había servidores levantados en 3001 o 5173 durante el e2e: no se aprobó el comando para ver los puertos (PC-15; ver Dudas).

## (5) Qué validó el pipeline y qué no

`scripts/validar-documentacion.mjs` y `.github/workflows/documentacion.yml` no se modificaron.

**Lo que validó, y que un control habría detectado si faltaba:**

- C6: que `?buscar=` esté en la tabla de endpoints del contexto. Es el único control que este cambio podía hacer fallar. Lo comprobé en el paso 2 quitando solo el cambio del contexto: `npm run docs:validar` respondió `[C6] docs/contexto-del-portal.md: parámetro de consulta sin documentar: ?buscar= (apps/api/src/routes/tenderos.ts)`. Con toda la documentación de `main` el resultado sería el mismo y los otros seis controles seguirían en verde. Esto último lo deduje sin correrlo: ningún archivo de código encogió, no hay rutas, ADR ni migraciones nuevas, y el error nuevo no es un literal.
- C1: que todas las citas de los documentos, incluidas las nuevas de este archivo y de `tenderos.md`, apunten a archivos y líneas que existen.

**Lo que ningún control comprueba, y tiene que revisar una persona:**

1. **Que las citas digan lo que el documento afirma.** C1 estaba en verde antes de mover las 52 citas y las 6 cortas de `tenderos.md`, porque `tenderos.ts` y `Tenderos.tsx` solo crecieron. Por ejemplo, `tenderos.ts:113-116`, citado como el 400 «Falta el vendedor.» del PUT, pasó a ser el final de `GET /api/tenderos/:id` y el comentario que abre el PUT. Revisar el diff de `tenderos.md` cita por cita.
2. **Citas de documentos de otros commits.** El ADR 0001 tiene 19 citas a `tenderos.ts`. Tres declaran su versión: `:12` «en esa versión» (`0001-identificacion-del-vendedor.md:21`), `:52` en `eab6b5c` (`:22`) y `:42` «la línea de entonces» (`:69`). Las otras 16 se escribieron sobre `6115adb`, donde `tenderos.ts` era igual que en `main`, y en esta rama apuntan a líneas desplazadas. Por ejemplo, `zonaDelVendedor` está en `:19-27` y se usa en `:34` y `:113`, y ahora está en `:20-28` y se usa en `:37` y `:125`. La auditoría y `HU-101-pr.md` también citan líneas de esos archivos; `HU-101-pr.md` declara que las suyas son del commit `b1550f4` (`:81`). No los toqué: el README de decisiones prohíbe editar el contenido de un ADR (ver Dudas).
3. **Que el estado «hecho» sea verdad.** El script no sabe qué cubre el e2e. Hay que comprobar en §7 que «hecho» solo está donde hay e2e y que P3, P4 y P5 dicen «parcial».
4. **Que las reglas R27 a R31 estén escritas al derecho** y que las propuestas digan «pendiente de aprobación» y no «aprobado». Ningún control lee el sentido de una regla.
5. **El mensaje de error nuevo de la API.** C3 solo busca mensajes escritos como literal (`error: '…'`). El 400 de `buscar` repetido usa la constante `MENSAJE_GENERAL` (`tenderos.ts:45`), así que C3 no lo vería aunque faltara en los documentos. Está en `contexto-del-portal.md:56` y en `tenderos.md:97` porque lo agregué a mano.
6. **Los textos de la pantalla** («Buscar tienda», «No hay tiendas con ese nombre en tu zona») no los revisa ningún control: no son errores de la API ni rutas. C7 no aplica, porque no hay ruta nueva de la web.
7. **C6 se conforma con que `buscar=` aparezca en cualquier parte del contexto,** no en la fila del endpoint correcto. Hay que revisar que esté en la fila de `GET /api/tenderos`.
8. **Que una prueba citada falle si se quita el cambio.** Las pruebas de CA3 de la API pasarían igual con el código de `main` (sección 2).
9. **El script se describe a sí mismo con cinco controles** (`scripts/validar-documentacion.mjs:5`, «Comprueba cinco cosas»), pero tiene siete: C6 y C7 no están en el comentario de cabecera. No lo modifiqué; lo dejo anotado para quien mantiene el script.

## (6) Decisiones propuestas, pendientes de aprobación

Ninguna está aprobada. El detalle y el porqué de cada una están en `docs/planes/HU-103-decisiones-propuestas.md:9-14`; en `docs/modulos/tenderos.md` son R27 a R31.

| Id | Propuesta | Quién la aprueba |
|---|---|---|
| P1 | El filtro va en la API (`?buscar=`), no en la web | Tech lead |
| P2 | Se compara en minúsculas y sin marcas diacríticas, **incluida la de la ñ** («dona» encuentra «Doña»), y coincide si el texto está en cualquier parte del nombre | Product owner |
| P3 | Los caracteres se cuentan sin los espacios de los extremos; solo espacios = vacío; la API también devuelve la lista completa con menos de 3, sin error | Product owner |
| P4 | `buscar` repetido → 400 «Revisa los datos del tendero.» (D10); sin límite de longitud | Tech lead |
| P5 | La web pide la lista en cada cambio del texto efectivo, sin espera, y descarta respuestas viejas; el mensaje de CA4 solo con búsqueda activa | Tech lead |
| P6 | Sin migración: función de SQLite `comparable` registrada al crear las rutas | Tech lead |

Si P2 o P3 cambian, el cambio está en `validaciones/busqueda.ts:10-12` o `:19-25` y en las pruebas que citan esas propuestas.

## (7) Riesgos y lo que puede fallar

1. **CA5 depende de que el cliente diga la verdad.** La zona sale del `vendedorId` que envía el cliente (ADR 0001, PC-03): cambiando ese valor se busca en otra zona. La búsqueda no agrega el riesgo, pero lo hereda.
2. **Una llamada por cada letra a partir de la tercera (P5).** Con las 5 tiendas de una zona de `test-data/` no se nota; con zonas grandes o mala conexión puede pesar. Se arregla con una espera, sin cambiar la API.
3. **Si la búsqueda falla, quedan visibles las filas de la búsqueda anterior** junto al mensaje de error (`Tenderos.tsx:33-34, 45`). No hay prueba de ese caso.
4. **Inactivos en los resultados.** La búsqueda devuelve tenderos inactivos de la zona, como la lista (PC-14, `busqueda-tenderos.test.ts:87-94`). Si el product owner decide ocultarlos de la lista, la búsqueda tiene que cambiar igual.
5. **La función `comparable` solo existe si se crearon las rutas de tenderos** (`tenderos.ts:33`). Una consulta que la use desde otro módulo, sin pasar por `rutasTenderos`, falla. Depende de `DatabaseSync.function` de `node:sqlite`, disponible en la versión que pide `package.json:6`.
6. **Sin índice.** `instr(comparable(nombre_tienda), ?)` recorre todos los tenderos de la zona en cada búsqueda. Con el volumen actual no importa.
7. **Letras sin descomposición Unicode** (por ejemplo, «ø» o «ł») no se igualan a su letra base. No hay ninguna en `test-data/`.
8. **El e2e comparte la base en memoria con `registro-tendero.spec.ts`**, que agrega «Tienda Prueba Norte» a la zona Norte; por eso la lista completa se comprueba por nombre y no por cantidad. Un e2e futuro que registre una tienda con «esq», «roble», «dona» o «jose» en el nombre, o en la zona Norte con el nombre de una tienda de otra zona, rompería estas pruebas.
9. **CA5 se prueba con un solo ejemplo** («pinos»). La consulta filtra siempre por zona (`tenderos.ts:48-52`), pero ninguna prueba recorre todas las tiendas de otras zonas desde la búsqueda.
10. **No hay plan aprobado de HU-103 en `docs/planes/`**, aunque la forma de trabajo de `CLAUDE.md` lo pide antes de escribir código (ver Dudas).

## (8) Uso de IA

**Lo que hizo Claude (Claude Code):**
- Leyó la historia, el código, las pruebas y los documentos indicados.
- Propuso y escribió las decisiones P1 a P6 como propuestas.
- Escribió el código de la API y de la web, las pruebas (Supertest, Testing Library y Playwright) y la documentación de cada paso.
- Movió las citas desplazadas de `tenderos.md` con un script fuera del repositorio y revisó el resultado.
- Corrió `npm run docs:validar`, `npm test`, `npm run lint` y `npm run test:e2e` y copió su salida.
- Comprobó que C6 detecta la falta de `?buscar=` y que la prueba P5 detecta una mutación.
- Hizo los commits y redactó esta descripción.
- A pedido tuyo revisó el cambio contra los criterios y, al encontrar incumplimientos, rehízo los commits de los pasos 2 a 5:
  - documentó PC-14 y PC-16 en el paso 2 y no en el 3;
  - puso la salida real de cada paso;
  - amplió el e2e;
  - cambió la etiqueta de dos pruebas que no comprobaban un criterio;
  - marcó P2, P3 y P4 como propuestas en el contexto;
  - corrigió cifras de esta descripción.

  La versión anterior quedó en la rama local `hu-103-respaldo`.

**Lo que decidiste tú:**
- Implementar HU-103 en esta rama, con un commit por paso y la documentación en el mismo commit.
- Que cada criterio tenga su prueba por capa y al menos un e2e.
- No tocar `scripts/validar-documentacion.mjs` ni `.github/workflows/documentacion.yml`.
- Que las decisiones abiertas se decidan, se expliquen y queden como propuestas.
- El criterio de «hecho» de la tabla de estado y el formato de esta descripción.
- Revisar el cambio y rehacer los commits.

**Lo que falta de una persona:**
- La revisión del pull request con `docs/lista-de-revision-codigo-generado.md`, incluida la sección 5 de este documento.
- La aprobación o el cambio de P1 a P6.
- Volver a correr los cuatro comandos en tu entorno, sin confiar en esta salida (punto 5.2 de la lista).

No se abrieron archivos con valores de entorno, secretos ni llaves, y no apareció ningún dato que parezca real.

---

## Dudas

| Duda | Por qué no se resuelve leyendo el repositorio | A quién preguntar |
|---|---|---|
| ¿La ñ cuenta como n al buscar (P2)? | CA2 dice «sin distinguir … tildes» y no menciona la ñ (`backlog-sprint-1.md:53`) | Product owner |
| ¿Los espacios de los extremos cuentan para los 3 caracteres (P3)? | CA3 habla de «menos de 3 caracteres» sin aclararlo (`backlog-sprint-1.md:54`) | Product owner |
| ¿La búsqueda, como la lista, debe mostrar tenderos inactivos? | Es la duda abierta de PC-14 (`docs/modulos/tenderos.md:345`); la historia no la toca | Product owner |
| ¿Hace falta esperar a que el vendedor deje de escribir antes de buscar (P5)? | La historia no habla de la frecuencia de las llamadas ni del tamaño esperado de una zona | Tech lead |
| ¿Se exige un plan aprobado en `docs/planes/` antes de fusionar, como dice la forma de trabajo de `CLAUDE.md`? | Para HU-103 no hay plan: la tarea pedía implementar directamente | Tech lead |
| ¿Hay que actualizar las citas del ADR 0001, la auditoría y `HU-101-pr.md` cuando el código se mueve, o valen respecto del commit en que se escribieron? | El README de decisiones prohíbe editar el contenido de un ADR superado, pero no dice nada de las citas que se desplazan; la auditoría no declara su commit | Tech lead |
| ¿Se corrige la cabecera del script, que habla de cinco controles y tiene siete? | Esta tarea prohíbe modificar el script | Quien mantiene el script (tech lead o el profesor que lo sembró) |
| ¿Había servidores levantados en 3001 o 5173 durante el e2e? | No se aprobó el comando para ver los puertos; si los había, Playwright los reutilizó (PC-15) | La persona que ejecutó la corrida |
| ¿Se borra la rama local `hu-103-respaldo`? | Guarda la versión anterior de estos commits; no se publicó | Tú |
