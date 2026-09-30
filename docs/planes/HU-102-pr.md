## Qué cambia

La API ahora tiene `PUT /api/tenderos/:id` para editar los 5 datos que el vendedor puede corregir: nombre del tendero, nombre de la tienda, teléfono, correo y dirección. Rechaza los datos inválidos, los campos que no se pueden editar, los tenderos de otra zona (403) y los tenderos inactivos (409). El tendero no cambia en ninguno de esos casos. Este cambio no toca pantallas: el formulario sigue sin poder guardar hasta el paso 5 (ver «Riesgos»).

## Historia

**HU-102 · Edición de datos del tendero**. Historia: `docs/historias/HU-102-edicion-de-datos-del-tendero.md`. Respuestas del product owner: `docs/historias/HU-102-respuestas-del-product-owner.md`. Plan aprobado: `docs/planes/HU-102-plan.md`. Este PR cubre los **pasos 1, 2 y 3**. Decisiones del equipo: `docs/planes/HU-102-decisiones-del-equipo.md`. Tabla criterio–prueba: `docs/planes/HU-102-pruebas.md`.

**Base del PR y dependencia.** Este PR va contra la rama `hu-101-registro-tenderos` y no contra `main`, porque HU-101 todavía no está fusionada en `main` (PR #1, abierto). **Depende del PR #1:** se fusiona después de él. El diff propio de este PR es el de `git diff hu-101-registro-tenderos...HEAD`: 7 commits y 12 archivos. La rama sale de `0f999df`. Después de ese commit, `hu-101-registro-tenderos` recibió tres commits más (`e3ddc9e`, `d45980d` y `c34eecb`), que no están en esta rama. `git merge-tree` no muestra conflictos con ellos.

Commits de HU-102 en la rama:

| Commit | Contenido |
|---|---|
| `d3bb4b2` | Historia, respuestas del product owner, plan y decisiones del equipo |
| `f95526e` | Paso 1: `esquemaEdicionTendero` en `apps/api/src/validaciones/tendero.ts` |
| `458e219` | Paso 2: `PUT /api/tenderos/:id` guarda los 5 campos editables |
| `021b2d7` | Paso 3: 403 para otra zona y 409 para tendero inactivo |
| `b118d04` | Ajustes de la revisión: se quita el tipo `EdicionTendero`, que no se usaba, y se agrega la prueba con solo `numeroDocumento` |
| `a73a899` | Aprobación de los mensajes D12 y D13 en las decisiones de HU-102. También agrega D11 en `docs/planes/HU-101-decisiones-del-equipo.md`, así que ese archivo de HU-101 aparece en el diff |
| `00e55ac` | Pruebas del endpoint y tabla `HU-102-pruebas.md`. También agrega pruebas de CA1 (formulario) y CA18 (lista) sobre código que ya existía |

Cambios respecto del texto del plan, según las decisiones del equipo:
- El esquema va en `apps/api/src/validaciones/tendero.ts`, el módulo de HU-101, y reutiliza sus reglas de teléfono y correo. El plan decía `validacion/tendero.ts`.
- Los mensajes que el plan dejaba [POR DEFINIR] usan los aprobados en HU-101, D10, D12 y D13.
- El orden de las comprobaciones es: id (400) → vendedor (400) → el tendero existe (404) → zona (403) → inactivo (409) → cuerpo (400).
- No hay migración nueva.

Archivos de código del cambio: `apps/api/src/routes/tenderos.ts` (función `zonaDelVendedor`, que comparten la lista y la edición, y ruta `PUT`, línea 106) y `apps/api/src/validaciones/tendero.ts` (`telefonoEdicion`, `correoEdicion` y `esquemaEdicionTendero`, líneas 103 a 125). El manejador de JSON mal formado de `apps/api/src/app.ts` (línea 20) ya existía desde HU-101 (`0f999df`). Este cambio no lo modifica, pero también aplica al `PUT`.

Abreviaturas de la tabla:
- **T**: `apps/api/test/tenderos.test.ts`, bloque `PUT /api/tenderos/:id`.
- **V**: `apps/api/test/validacion-tendero.test.ts`, bloque `esquemaEdicionTendero`.
- **R**: `apps/api/src/routes/tenderos.ts`.
- **E**: `apps/api/src/validaciones/tendero.ts`.

| Criterio de aceptación | Dónde se cumple | Prueba que lo comprueba |
|---|---|---|
| CA1 Abrir la edición | Fuera de este cambio (formulario, pasos 5 y 7) | Fuera de este cambio. `00e55ac` agrega a `apps/web/test/EditarTendero.test.tsx` «cada campo muestra el valor que devuelve GET (CA1)» y «solo los 5 campos de P1 c son editables (CA1)», sobre el formulario que ya existía. |
| CA2 Teléfono válido | R, `UPDATE` con parámetros; E, `telefonoEdicion` | T · «guarda un teléfono válido (CA2)»; V · «acepta el teléfono 5559876543 y lo entrega como se escribió (CA2, CA6)» |
| CA3 Agregar correo | R, `UPDATE`; E, `correoEdicion` | T · «agrega un correo al tendero 3 (CA3)» |
| CA4 Teléfono inválido | API: E, `telefonoEdicion` (D12). El formulario queda fuera de este cambio (pasos 4 y 5). | T · «rechaza un teléfono con letras y no cambia el tendero (CA4, CA13)»; V · «un teléfono con letras produce el mensaje de CA4». Formulario: fuera de este cambio. |
| CA5 Correo inválido | API: E, `esquemaCorreo`. El formulario queda fuera de este cambio (pasos 4 y 5). | T · «rechaza un correo inválido con el mismo cuerpo que el formulario (CA5, CA13)»; V · «rechaza el correo esquina.ejemplo.test (CA5)» y «rechaza el correo tendero3.ejemplo.test (CA5)». Formulario: fuera de este cambio. |
| CA6 Separadores y longitud | E, `esquemaTelefono`, reutilizada de HU-101 | T · «guarda 555 123 4567 como se escribió (CA6)», «rechaza el teléfono 555 y no lo cambia (CA6)», «rechaza el teléfono 5551234567890123 y no lo cambia (CA6)»; V · «rechaza el teléfono … por su longitud (CA6)» |
| CA7 Campos vacíos | E, `esquemaTelefono` (obligatorio) y `esquemaCorreo` (vacío → `NULL`) | T · «el teléfono vacío del tendero 4 es obligatorio (CA7)», «un correo vacío borra el correo guardado (CA7)»; V · «el teléfono "" es obligatorio (CA7, P4 b)», «el correo "" queda nulo (CA7, P4 b)» |
| CA8 Normalización | E, `trim` sin pasar a minúsculas (P5) | T · «quita los espacios de los extremos del correo y conserva las mayúsculas (CA8)»; V · «… (CA8, P5)». Se guarda `Tendero3@Ejemplo.TEST`, según P5 y no según la [Propuesta] del texto de la historia. |
| CA9 Otra zona | R, línea 126 (403) | T · «no edita un tendero de otra zona (CA9)», «no edita un tendero activo de otra zona aunque el cuerpo sea válido (CA9)», «un tendero inactivo de otra zona responde 403» |
| CA10 Id 9999 | R, 404 «No encontramos este tendero.» | T · «responde 404 con el id 9999 (CA10)» |
| CA11 Id `abc` | R, 400 «El id del tendero debe ser un número.» | T · «responde 400 con el id abc (CA11)» |
| CA12 Campos no permitidos | E, `z.strictObject` | T · «rechaza un cuerpo con solo zona y estado (CA12)», «rechaza un cuerpo válido con zona, estado y documento, y no cambia nada (CA12)»; V · «rechaza el campo no editable … aunque el resto sea válido (CA12, P1 c)» |
| CA13 Validación en la API | R y E: la API valida sin pasar por el formulario | T · pruebas de CA4 y CA5, que comparan el cuerpo exacto con Supertest |
| CA14 `D'Luis` | R, `UPDATE` con parámetros `?` | T · «guarda exactamente el nombre D'Luis (CA14)» |
| CA15, CA19, CA20 Documento | E, `z.strictObject`. Versión «el documento no se edita» (decisiones del equipo) | T · «el documento no se edita: CA15 / CA19 / CA20 responde 400 y el documento no cambia», «los 5 campos válidos más solo numeroDocumento responden 400 y el tendero no cambia (P1 c)» |
| CA16 Tendero inactivo | API: R, línea 130 (409). El formulario queda fuera de este cambio (paso 5). | T · «no edita un tendero inactivo de la zona (CA16)». Formulario: fuera de este cambio. |
| CA17 Sin cambios | R | T · «guardar sin cambios responde 200 y deja los datos iguales (CA17)» |
| CA18 Se ve en la lista | Fuera de este cambio (lista y navegación, pasos 5, 6 y 7) | Fuera de este cambio. `00e55ac` agrega a `apps/web/test/Tenderos.test.tsx` «muestra «Datos actualizados» y el teléfono nuevo al volver de la edición (CA18)», sobre la lista que ya existía. |

Pruebas del endpoint que no corresponden a un criterio, sino a decisiones del equipo:
- «sin vendedorId / vendedorId no numérico / vendedorId que no existe responde 400 y el tendero no cambia»;
- «comprueba el id antes que el vendedor, y el vendedor antes que la existencia del tendero»;
- «un JSON mal formado responde 400 sin detalle interno».

## Evidencia de pruebas

- [x] `npm test` pasa
- [x] `npm run lint` pasa
- [x] `npm run test:e2e` pasa. Las 2 pruebas que existían pasan; no hay prueba e2e de la edición (paso 7, fuera de este cambio).

Ejecución del 30 de septiembre de 2026 sobre el commit `00e55ac`, rama `hu-102-edicion-tendero`. El commit que agrega esta descripción solo cambia `docs/planes/HU-102-pr.md`. No se ejecutaron las pruebas sobre la unión con los tres commits posteriores de `hu-101-registro-tenderos`.

`npm test`:

```
apps/api
 Test Files  7 passed (7)
      Tests  200 passed (200)

apps/web
 Test Files  3 passed (3)
      Tests  14 passed (14)
```

`npm run lint`: `tsc --noEmit` en `apps/api` y en `apps/web`, sin errores.

`npm run test:e2e`:

```
Running 2 tests using 1 worker
  ✓  1 [chromium] › e2e/navegacion.spec.ts:3:5 › el vendedor ingresa, consulta el catálogo y ve los tenderos de su zona (909ms)
  ✓  2 [chromium] › e2e/navegacion.spec.ts:19:5 › un código de vendedor desconocido muestra un error (427ms)
  2 passed (4.4s)
```

Solo las pruebas de HU-102 en la API (`npm test -w apps/api -- tenderos.test validacion-tendero --reporter=verbose -t "PUT /api/tenderos/:id|esquemaEdicionTendero"`):

```
 Test Files  2 passed (2)
      Tests  67 passed | 44 skipped (111)
```

Son 29 pruebas del bloque `PUT /api/tenderos/:id` y 38 del bloque `esquemaEdicionTendero`. Las 44 omitidas son las de `GET` y las del registro (HU-101), que el filtro excluye y que pasan en la ejecución completa de arriba.

**Mutaciones manuales**, registradas en `docs/planes/HU-102-pruebas.md`. Todas se detectan:
- quitar el control de zona;
- quitar el control de tendero inactivo;
- quitar la regla «solo números»;
- quitar toda la validación del teléfono.

**Pruebas manuales:** [POR COMPLETAR]. No se ejecutaron las comprobaciones con `curl` de los pasos 2 y 3 del plan (id `abc` → 400; tendero 7 con `vendedorId=1` → 403 y el teléfono sigue en `555-0107`). Los mismos casos están cubiertos con Supertest (CA11 y CA9).

## Capturas

No aplica: los commits de HU-102 no modifican ninguna pantalla (`apps/web/src` no cambia). En la web solo se agregan pruebas.

## Riesgos

**Qué puede fallar:**
- **Guardar desde el formulario no funciona todavía.** `api.actualizarTendero` (`apps/web/src/lib/api.ts`, línea 54) no envía `vendedorId`, así que el `PUT` responde 400 «Falta el vendedor.». Antes de este cambio tampoco guardaba, porque la ruta no existía. Se corrige en el paso 5 (plan, riesgo 16).
- **La identidad del vendedor se puede falsificar.** Llega como `?vendedorId=` desde el cliente, así que el control de zona (403) no protege frente a alguien que cambie ese valor. La protección real llega con el ingreso con contraseña, fuera de este sprint (decisiones del equipo).
- **Tenderos sin teléfono.** Los tenderos de `test-data/` sin teléfono (4, 8 y 12, según `test-data/tenderos.json`) no se pueden guardar «sin cambios» hasta que se complete el teléfono, porque el teléfono es obligatorio (P4 b). Es coherente con P4 b, pero puede sorprender a quien pruebe.
- **Mensajes distintos en `GET` y `PUT`.** `GET /api/tenderos/:id` sigue respondiendo «Identificador inválido» y «Tendero no encontrado» (`apps/api/src/routes/tenderos.ts`, líneas 93 y 98). El `PUT` responde «El id del tendero debe ser un número.» y «No encontramos este tendero.». Unificarlos queda fuera de la historia (plan, riesgo 12).
- **Edición parcial.** El `PUT` exige los 5 campos (decisiones del equipo), así que un cliente que envíe solo el campo que cambia recibe 400.

**Qué no se probó:**
- La validación y los mensajes en el formulario (CA4, CA5 y CA16 en la interfaz), la navegación a la lista con «Datos actualizados» (CA18) y el flujo e2e de edición.
- Las comprobaciones manuales con `curl` (ver «Evidencia de pruebas»).

**Qué queda fuera del alcance:** los pasos 4 a 7 del plan: validación en el formulario, guardar desde el formulario con `vendedorId`, bloqueo del tendero inactivo en la interfaz, mensaje en la lista y prueba e2e.

**Documentación:**
- **La historia no está corregida.** CA15, CA19 y CA20 todavía esperan que el documento se pueda editar, y CA8 conserva la [Propuesta] de pasar el correo a minúsculas. Las pruebas siguen las decisiones del equipo y P5. El product owner corrige la historia aparte.

La tabla de endpoints de `docs/contexto-del-portal.md` ya incluye el `PUT`, como piden las decisiones del equipo (HU-101, D7). La fila «Edición de datos del tendero» ahora dice que la API guarda los cambios y que la pantalla todavía no.

**Dependencia del PR #1:** si el PR #1 cambia antes de fusionarse, esta rama puede necesitar actualizarse contra `hu-101-registro-tenderos` y repetir las pruebas.

## Uso de IA

Lo que consta en el repositorio:
- **Commits con Claude.** Los commits de los pasos 1, 2 y 3 (`f95526e`, `458e219`, `021b2d7`) y el de ajustes de la revisión (`b118d04`) llevan `Co-Authored-By: Claude Opus 5.5`. El commit de pruebas (`00e55ac`) lo firma Claude como autor, con el mismo trailer. El commit de aprobaciones de mensajes (`a73a899`) lleva `Co-Authored-By: Claude Sonnet 4.6`.
- **Commit sin trailer.** El commit de la historia, las respuestas, el plan y las decisiones (`d3bb4b2`) no lleva trailer de Claude.
- **Corrección del código generado.** `b118d04` quita el tipo `EdicionTendero`, que no se usaba (código muerto), y agrega la prueba del `PUT` con los 5 campos válidos más solo `numeroDocumento`.
- **Comprobación de las pruebas.** `docs/planes/HU-102-pruebas.md` relaciona cada criterio con sus pruebas y registra 4 mutaciones manuales que las pruebas detectan.
- **Esta descripción.** Claude la redactó a partir del plan, las decisiones, la tabla de pruebas y los commits de la rama. Claude ejecutó ahora `npm test`, `npm run lint` y `npm run test:e2e`, cuya salida se copia en «Evidencia de pruebas».

[POR COMPLETAR por el autor del PR]:
- **Qué revisaste tú.** El repositorio no registra quién hizo la revisión de `b118d04` ni la aplicación de `docs/lista-de-revision-codigo-generado.md` a los pasos 1 a 3.
- **Registro de la sesión.** Solo `a73a899` tiene un enlace `Claude-Session`. Los commits de los pasos 1, 2 y 3 y el de pruebas no enlazan ninguna sesión.
- **Pasos hechos con Claude antes de implementar.** No consta si el análisis de la historia, las preguntas al product owner y el plan se hicieron con Claude.


🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_011DCg5j6WaQUYk4GqgEvEwn
