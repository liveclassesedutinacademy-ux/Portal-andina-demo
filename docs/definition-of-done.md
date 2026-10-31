# Definition of Done · Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este repositorio son inventados.

Escrito sobre la rama `definition-of-done` (commit `0a65de6`, igual a `main` tras el PR #5) el 31 de octubre de 2026. Cada criterio dice qué evidencia lo comprueba y dónde se abre. Si una parte de un criterio no tiene hoy una evidencia que otra persona pueda abrir, la tabla lo dice, esa parte se responde «no» y la sección 6 dice qué falta.

---

## 1. Para qué sirve

Se aplica a **cada historia**, antes de pasarla a «Finalizada» en Jira: si un criterio responde «no», la historia no se finaliza.
Cada criterio se responde con sí o no mirando una evidencia que otra persona puede abrir: un archivo y una línea, una corrida con nombre de un workflow, un pull request aprobado o un despliegue en el ambiente «laboratorio».
Lo comprueba el revisor del pull request para lo que está en el PR y quien pasa la historia a «Finalizada» para lo que ocurre después de la fusión (quiénes son esas personas: ver Dudas).

---

## 2. El DoD por nivel

Nombres que usa la tabla:

- **Workflow «Despliegue de laboratorio»**: `.github/workflows/despliegue-laboratorio.yml:1`, job `desplegar` (`despliegue-laboratorio.yml:18-20`, ambiente `laboratorio`). Corre en cada empuje a `main` y a mano (`despliegue-laboratorio.yml:9-12`). Sus pasos: «Pruebas de la API y de la web» (`npm test`, `despliegue-laboratorio.yml:32-33`), «Revisión de tipos» (`npm run lint`, `despliegue-laboratorio.yml:35-36`), «Validación de la documentación» (`npm run docs:validar`, `despliegue-laboratorio.yml:38-39`), «Construir la web» (`despliegue-laboratorio.yml:41-42`) y «Guardar el paquete desplegado» (artefacto `portal-andina-<commit>`, `despliegue-laboratorio.yml:44-47`).
- **Workflow «Documentación»**: `.github/workflows/documentacion.yml:1`, job `validar` (`documentacion.yml:14-24`), paso «Validar la documentación». Corre en cada pull request y en cada empuje a `main` (`documentacion.yml:8-11`) y deja el artefacto `informe-documentacion` (`documentacion.yml:30-34`).
- **Comandos** (`package.json` de la raíz): `npm test` (línea 9: Vitest en `apps/api` y `apps/web`), `npm run test:e2e` (línea 10: Playwright), `npm run lint` (línea 11: `tsc --noEmit` en las dos aplicaciones, `apps/api/package.json` y `apps/web/package.json`, línea 9) y `npm run docs:validar` (línea 13: `scripts/validar-documentacion.mjs`).
- **Tabla de criterios del PR**: la tabla «Criterio de aceptación | Dónde se cumple | Prueba que lo comprueba» de la plantilla (`.github/pull_request_template.md:9-11`).
- **Criterio de pantalla**: un criterio de aceptación de la historia cuyo «cuando» o «entonces» nombra una acción del vendedor en el portal (elige, escribe, cambia, guarda, vuelve) o algo que se ve en él (formulario, lista, mensaje). Ejemplo: CA2 de HU-102 («cuando cambia el teléfono… y guarda», `docs/historias/HU-102-edicion-de-datos-del-tendero.md:16-19`) es de pantalla aunque su «entonces» hable de la API.
- **Prueba unitaria**: un `it(...)` que no levanta la API ni la base: `apps/api/test/documento.test.ts`, `apps/api/test/validacion-tendero.test.ts` y los componentes de `apps/web/test/*.test.tsx` (con `fetch` simulado; `apps/web/vite.config.ts:15`).
- **Prueba de integración**: un `it(...)` con Supertest sobre la app con base en memoria cargada desde `test-data/` (`appDePrueba`, `apps/api/test/ayuda.ts:7-11`). Hoy son `catalogo`, `registro-tendero`, `sesion` y `tenderos` en `apps/api/test/`. `migraciones.test.ts` prueba la base sin la API (`apps/api/test/migraciones.test.ts:5-9`) y no cuenta para I1.
- **Prueba activa**: un `it(...)` o `test(...)` sin `.skip`, `.todo`, `.fixme` ni `.only`. Una prueba omitida no hace fallar la corrida, así que no cuenta como evidencia.

| Nivel | Id | Criterio (se responde sí o no) | Evidencia que lo comprueba | Dónde se ve | Quién lo comprueba |
|---|---|---|---|---|---|
| Prueba unitaria | U1 | Cada acción que nombra el «cuando» de un criterio de pantalla de la historia (enviar el formulario, navegar después de guardar, mostrar un error) y cada función de validación que la historia usa tienen una prueba unitaria activa que la ejecuta, **aunque ese código existiera antes de la historia**. Si la acción llama a la API, la prueba compara la URL y el método que recibe `fetch`. | Dos evidencias, cada una prueba una mitad: (1) el archivo y la línea de cada `it(...)` en la columna «Prueba que lo comprueba» de la tabla de criterios del PR, que muestran que la prueba existe, está activa y compara la URL; (2) el paso «Pruebas de la API y de la web» en verde en la corrida de «Despliegue de laboratorio» del commit de fusión, que muestra que pasa. | (1) Descripción del PR en GitHub y el archivo citado. (2) Actions › «Despliegue de laboratorio» › corrida del commit › job `desplegar`. | (1) Revisor del PR. (2) Quien pasa la historia a «Finalizada». |
| Prueba de integración | I1 | Cada `res.status(...)` de las rutas que la historia crea o que sus pantallas llaman tiene una prueba de integración activa que provoca ese código y compara el cuerpo `{ "error": … }`. Cada condición sobre la zona del vendedor o el estado del tendero que aparece en el texto de la historia o en las respuestas del product owner tiene su prueba en **cada** una de esas rutas, también en las que ya existían. | (1) Pares de archivo y línea en la tabla de criterios del PR: la línea del `res.status(...)` en `apps/api/src/routes/` y la línea del `it(...)` en `apps/api/test/`. (2) El paso «Pruebas de la API y de la web» en verde, como en U1. | (1) Descripción del PR y los archivos citados. (2) Actions › «Despliegue de laboratorio». | (1) Revisor del PR. (2) Quien pasa la historia a «Finalizada». |
| Prueba de extremo a extremo | E1 | Cada criterio de pantalla de la historia tiene un `test(...)` activo en `e2e/*.spec.ts` que lo recorre en el navegador contra la API, con un `expect` por cada resultado que nombra su «entonces» (mensaje, fila de la lista, valor de un campo), **y esa prueba pasa**. Ejemplo de la primera mitad: `e2e/registro-tendero.spec.ts:28-38` (CA25 y CA2 de HU-101). | (1) El archivo y la línea de cada `test(...)` en la tabla de criterios del PR. (2) Que pasa: **hoy no hay evidencia**. Ningún workflow corre `npm run test:e2e`, y la salida pegada en el PR la escribe el autor. Mientras falte (sección 6), esta mitad se responde «no» en toda historia que tenga criterios de pantalla. | (1) Descripción del PR y el archivo citado. (2) Ninguna hoy. | (1) Revisor del PR. |
| Revisión de código | R1 | El PR de la historia tiene al menos una revisión «Approved» de una persona distinta del autor, hecha después del último commit, y no muestra ninguna revisión en estado «Changes requested». | El PR aprobado. | GitHub › el PR › pestaña Conversation (estado de las revisiones). | Quien pasa la historia a «Finalizada». |
| Revisión de código | R2 | La tabla de criterios del PR tiene una fila por cada criterio de aceptación de la historia, con archivo y línea en «Dónde se cumple» y en «Prueba que lo comprueba». En un criterio de pantalla, «Dónde se cumple» cita al menos una línea de `apps/web/src/` y «Prueba que lo comprueba» cita al menos una línea de `e2e/`. Una fila que dice «fuera de este cambio» lleva el número de otro PR fusionado en `main` cuya tabla tiene esa fila completa con estas mismas reglas; si no, la historia no está terminada. | La tabla de criterios del PR, comparada con la lista de criterios de la historia en `docs/historias/`. | Descripción del PR y el archivo de la historia. | Revisor del PR. |
| Documentación | D1 | La corrida de «Documentación» sobre el último commit del PR termina en verde, con los siete controles C1 a C7 sin incumplimientos. | La corrida del job `validar` y su artefacto `informe-documentacion` (campo `porCheck`, cero fallos por control). | GitHub › el PR › Checks › «Documentación». | Revisor del PR. |
| Documentación | D2 | Para cada criterio de pantalla, la tabla de criterios del PR cita la línea de la sección «Estado por funcionalidad» del documento de módulo que lo cubre; esa fila dice «Hecho» y cita en su evidencia un `e2e` con archivo y línea. Para tenderos, el criterio de «Hecho» está en `docs/modulos/tenderos.md:290`. | Las líneas citadas de `docs/modulos/tenderos.md` §7, cambiadas en el diff del mismo PR. | GitHub › el PR › Files changed, y el archivo en `main`. | Revisor del PR. |
| Despliegue | P1 | En el ambiente «laboratorio» hay un despliegue con resultado exitoso cuyo commit es el de la fusión del PR de la historia o uno posterior de `main`, y la corrida guardó el artefacto `portal-andina-<commit>`. | El despliegue registrado en el ambiente «laboratorio» por «Despliegue de laboratorio» (`docs/despliegue-de-laboratorio.md:18`). Esa corrida incluye el paso «Revisión de tipos» (`npm run lint`): si falla, no hay despliegue exitoso (`docs/despliegue-de-laboratorio.md:14`). | GitHub › Environments › laboratorio; y la corrida › Artifacts. | Quien pasa la historia a «Finalizada». |

Lo que P1 no dice: el ambiente no publica el portal en ningún servidor ni tiene dirección para visitarlo (`docs/despliegue-de-laboratorio.md:20`), y la corrida no ejecuta las pruebas e2e (`docs/despliegue-de-laboratorio.md:24`). «Desplegada» significa «el paquete del commit se construyó y se guardó después de pasar `npm test`, `npm run lint` y `npm run docs:validar`». Si un paso falla, el despliegue queda registrado como fallido y no hay paquete (`docs/despliegue-de-laboratorio.md:14`). P1 no dice nada sobre si una pantalla funciona: eso lo dicen U1, E1 y R2.

### Corridas de los comandos para este documento

Ejecutadas el 31 de octubre de 2026 sobre `0a65de6`. Ninguna falló.

`npm test`:

```
apps/api
 Test Files  7 passed (7)
      Tests  226 passed (226)

apps/web
 Test Files  3 passed (3)
      Tests  15 passed (15)
```

`npm run lint`: `tsc --noEmit` en `apps/api` y en `apps/web`, sin errores ni salida.

`npm run docs:validar`:

```
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

Corrido otra vez con este documento ya escrito: «25 documentos revisados», los siete controles en ✓ (las citas de este documento pasan C1).

`npm run test:e2e`, con `CI=1` para que Playwright no reutilice servidores ya levantados ni escriba en la base local (`playwright.config.ts:20, 26`; PC-15 en `docs/modulos/tenderos.md:331`):

```
Running 4 tests using 2 workers
  ✓  1 [chromium] › e2e/navegacion.spec.ts:3:5 › el vendedor ingresa, consulta el catálogo y ve los tenderos de su zona
  ✓  2 [chromium] › e2e/registro-tendero.spec.ts:28:5 › CA25 y CA2: registra un tendero y vuelve a la lista con «Tendero registrado»
  ✓  3 [chromium] › e2e/navegacion.spec.ts:19:5 › un código de vendedor desconocido muestra un error
  ✓  4 [chromium] › e2e/registro-tendero.spec.ts:40:5 › CA22 y CA13: un DI repetido con puntos muestra el mensaje y conserva lo escrito
  4 passed (3.5s)
```

Esta corrida la hice yo en mi equipo; no es la evidencia de E1 que pide la tabla.

Todo en verde y HU-102 sigue sin poder guardar desde el formulario: ninguna de estas corridas ejecuta la acción de guardar de `apps/web/src/pages/EditarTendero.tsx:32-41`. Que los comandos pasen no dice nada de lo que no prueban; por eso U1, I1 y E1 piden primero la prueba de cada acción, respuesta y criterio, y después la corrida que la hace pasar.

---

## 3. De dónde sale cada criterio

| Defecto (línea en `docs/modulos/tenderos.md`) | Qué pasó | Nivel que habría fallado | Criterio que lo habría detectado | También lo habría detectado |
|---|---|---|---|---|
| PC-01 (`docs/modulos/tenderos.md:317`) | Guardar desde el formulario de edición siempre responde «No se pudo guardar: Falta el vendedor.»: `apps/web/src/lib/api.ts:54-55` no envía `?vendedorId=` y la API responde 400 (`apps/api/src/routes/tenderos.ts:113-116`). Las pruebas de la API pasaban porque sí envían el vendedor, y `apps/web/test/EditarTendero.test.tsx:22-50` solo prueba la carga del formulario. El PR #2 no cambió ninguna pantalla (`docs/planes/HU-102-pr.md:119`). | Prueba unitaria | U1: «guarda» está en el «cuando» de CA2 (`docs/historias/HU-102-edicion-de-datos-del-tendero.md:16-19`), así que la acción «guardar» (`apps/web/src/pages/EditarTendero.tsx:32-41`) necesita su prueba aunque el formulario existiera antes de la historia. Esa prueba compara la URL del `PUT` con `/api/tenderos/1?vendedorId=1`, como pedía el plan (`docs/planes/HU-102-plan.md:185`), y habría fallado. | E1 (CA2 es criterio de pantalla) y R2: la fila de CA2 cita solo la API (`docs/planes/HU-102-pr.md:44`), y CA1 y CA18 figuran como «fuera de este cambio» (`docs/planes/HU-102-pr.md:43` y `docs/planes/HU-102-pr.md:60`) sin otro PR |
| PC-07 (`docs/modulos/tenderos.md:323`) | Tras guardar, la pantalla se queda en la edición con «Datos guardados» (`apps/web/src/pages/EditarTendero.tsx:37`) en vez de volver a la lista con «Datos actualizados» (P7, `docs/historias/HU-102-respuestas-del-product-owner.md:13`). La prueba de CA18 (`apps/web/test/Tenderos.test.tsx:50-65`) pasaba porque le entrega a la lista el mensaje ya puesto en `location.state`: prueba la lista, no la navegación. | Prueba de extremo a extremo | E1: CA18 es criterio de pantalla («cuando vuelve a la lista de tenderos», `docs/historias/HU-102-edicion-de-datos-del-tendero.md:96-99`). Un `test` en `e2e/` que guarde y espere «Datos actualizados» en la lista habría fallado. No hay ningún e2e de la edición (PC-17, `docs/modulos/tenderos.md:333`). | U1 (la navegación después de guardar es la acción del «cuando» de CA18: plan, `docs/planes/HU-102-plan.md:187`) |
| PC-08 (`docs/modulos/tenderos.md:324`) | `GET /api/tenderos/:id` devuelve un tendero de cualquier zona sin pedir el vendedor (`apps/api/src/routes/tenderos.ts:90-102`), y la pantalla de edición lo llama (`apps/web/src/pages/EditarTendero.tsx:18`): cualquiera que escriba la URL ve los datos. | Prueba de integración | I1: la pantalla de HU-102 llama a esa ruta y la historia habla de «un tendero de mi zona» (`docs/historias/HU-102-edicion-de-datos-del-tendero.md:7`). I1 pide la prueba de zona en **cada** ruta que la pantalla llama, no solo en el `PUT`; esa prueba no se podía escribir sin decidir qué responde el `GET`, así que el hueco aparecía antes de cerrar la historia. Qué debe responder sigue abierto (`docs/modulos/tenderos.md:341`). | — |
| PC-14 (`docs/modulos/tenderos.md:330`) | La lista muestra los tenderos inactivos con el enlace «Editar» (`apps/api/src/routes/tenderos.ts:40`; `apps/web/src/pages/Tenderos.tsx:37`) y guardar responde 409 (`apps/api/src/routes/tenderos.ts:129-132`). P6 b dice que el formulario no deja entrar a un inactivo (`docs/historias/HU-102-respuestas-del-product-owner.md:12`), y esa parte se dejó para «la etapa del formulario» (`docs/planes/HU-102-decisiones-del-equipo.md:41`), que no se hizo. | Revisión de código | R2: la fila de CA16 del PR dice «El formulario queda fuera de este cambio (paso 5)» (`docs/planes/HU-102-pr.md:58`) sin otro PR que lo cumpla. Con R2 la historia no se podía finalizar hasta que la parte de interfaz de CA16 tuviera código y prueba, y ahí se decide qué hace la lista con el enlace «Editar» de un inactivo. Si la lista debe mostrar los inactivos sigue abierto (`docs/modulos/tenderos.md:342`). | E1 no lo detecta hoy: `test-data/` no tiene tenderos inactivos y el e2e no tiene cómo crearlos (sección 6) |

---

## 4. El DoD anterior

| Criterio del DoD anterior | Qué se hizo | Por qué |
|---|---|---|
| «El código está limpio y sigue las buenas prácticas.» | Eliminado | «Limpio» y «buenas prácticas» no se pueden comprobar, y el repositorio no tiene ninguna evidencia que los mida. Lo más cercano es la revisión de tipos (`npm run lint`, que es solo `tsc --noEmit`: `CLAUDE.md:105`), que ya está dentro de P1; no mide limpieza. La lista de revisión de `docs/lista-de-revision-codigo-generado.md` dice qué mirar, pero su resultado no queda registrado en ningún lugar (`docs/planes/HU-102-pr.md:154`); por eso no es criterio todavía (sección 6). |
| «La historia tiene sus pruebas.» | Convertido en **U1**, **I1** y **E1** | No decía qué pruebas ni de qué nivel. HU-102 tenía 67 pruebas en `apps/api` (29 de integración del `PUT` y 38 unitarias de `esquemaEdicionTendero`, `docs/planes/HU-102-pr.md:107`) y el formulario no guarda. Ahora cada nivel pide la prueba activa de cada acción, respuesta o criterio de pantalla, y además que pase. Que una prueba exista ya no basta: en E1, mientras no haya corrida que la haga pasar, el criterio responde «no». |
| «Alguien revisó el pull request.» | Convertido en **R2**; **R1** conserva lo comprobable del original | «Revisó» no es «aprobó»: el PR #2 recibió «Request changes» (`docs/planes/HU-102-pr.md:147`). R1 solo comprueba el estado de aprobación, que es lo único del criterio original que GitHub registra; por sí solo no dice qué se revisó. Lo que se revisa está en R2: cada criterio de aceptación con su código y su prueba, y en los de pantalla con código de la web y e2e. |
| «La documentación está actualizada.» | Convertido en **D1** y **D2** | La palabra no dice contra qué se compara. D1 es la corrida de «Documentación», que comprueba que lo que los documentos citan existe; no comprueba que sea verdad (`docs/validacion-de-la-documentacion.md:30`), por eso D2 pide la fila de estado de cada criterio de pantalla en «Hecho» con su e2e. |
| «El product owner la vio y está de acuerdo.» | Eliminado | Ni el repositorio ni su GitHub registran que el product owner vio una historia terminada; lo único que registran son sus respuestas antes de implementar (`docs/historias/HU-102-respuestas-del-product-owner.md`). Lo que el product owner aprueba son los criterios de aceptación, y R2 y E1 comprueban que cada uno tiene código y prueba; pero eso no es su visto bueno, que queda sin criterio (sección 6 y Dudas). |
| «Está desplegada.» | Convertido en **P1** | No decía dónde ni cómo se comprueba. P1 pide el despliegue exitoso en «laboratorio» del commit de fusión, que deja registro con fecha, commit y resultado (`docs/despliegue-de-laboratorio.md:18`). |

---

## 5. Qué se enlaza en la historia para declararla «Finalizada»

En el orden en que se consiguen:

1. **El PR de la historia**, con la tabla de criterios completa: archivo y línea de cada prueba unitaria (U1), de integración (I1) y de extremo a extremo (E1), de dónde se cumple cada criterio (R2) y de la fila de estado de cada criterio de pantalla (D2). Si una fila dice «fuera de este cambio», el enlace al otro PR fusionado que la cumple.
2. **El diff del documento de módulo** en ese PR, con esas filas en «Hecho» y su e2e citado (D2).
3. **La corrida de «Documentación»** en verde sobre el último commit del PR (D1).
4. **La revisión «Approved»** del PR, de una persona distinta del autor (R1).
5. **La corrida de «Despliegue de laboratorio»** del commit de fusión, con el paso «Pruebas de la API y de la web» en verde (U1, I1).
6. **El despliegue en Environments › laboratorio** de ese commit o de uno posterior, con resultado exitoso y el artefacto `portal-andina-<commit>` (P1).

La corrida que muestra que las pruebas e2e pasan (segunda mitad de E1) no se puede enlazar hoy: ningún workflow la produce (sección 6). La salida de `npm run test:e2e` pegada en el PR no la reemplaza.

---

## 6. Lo que el repositorio todavía no permite comprobar, y qué haría falta

| Qué no se puede comprobar | Por qué | Qué haría falta |
|---|---|---|
| Que las pruebas e2e **pasan** (segunda mitad de E1) | Ningún workflow ejecuta `npm run test:e2e`: «Despliegue de laboratorio» no lo corre porque necesita un navegador (`docs/despliegue-de-laboratorio.md:24`) y «Documentación» solo valida documentos. La única constancia es la salida pegada en el PR (`.github/pull_request_template.md:17`), que nadie más puede abrir como corrida. Mientras falte, ninguna historia con criterios de pantalla cumple E1. | Un workflow que instale el navegador de Playwright y corra `npm run test:e2e` en cada PR con `CI` definido, para que no reutilice servidores (`playwright.config.ts:20, 26`). Cambiar workflows queda fuera de este documento. |
| Un e2e de un tendero inactivo (CA16 de HU-102, PC-14) | `test-data/` no tiene tenderos inactivos, el product owner pidió crearlos en la preparación de cada prueba y no en `test-data/` (`docs/historias/HU-102-respuestas-del-product-owner.md:18`), y la app no tiene forma de crear uno (`docs/modulos/tenderos.md:298`). El e2e solo usa la API levantada con `test-data/` (`playwright.config.ts:15-22`). | Que el tech lead decida cómo prepara el e2e un tendero inactivo sin cambiar `test-data/`. |
| `npm test` y `npm run lint` **antes** de fusionar | Ningún workflow los corre en el PR: «Documentación» solo ejecuta el validador (`documentacion.yml:23-24`) y «Despliegue de laboratorio» corre en `main` (`despliegue-laboratorio.yml:9-12`). La regla «deben pasar antes de abrir el pull request» (`CLAUDE.md:120`) depende de lo que diga el autor. U1, I1 y la revisión de tipos de P1 solo tienen evidencia después de la fusión. | Un workflow en `pull_request` con `npm test` y `npm run lint`. |
| Pruebas unitarias y de integración por separado | Las dos corren en el mismo `npm test` y en el mismo paso del workflow; solo se distinguen por el archivo. | Si se quiere una corrida por nivel, dos comandos separados. Hoy no hace falta para responder U1 e I1, que se comprueban por archivo y línea. |
| El resultado de la lista de revisión de código | `docs/lista-de-revision-codigo-generado.md:3` pide anotar «Sí», «No» o «No aplica», pero no dice dónde, y la plantilla del PR no tiene una sección para eso. HU-102 lo dejó «por completar» (`docs/planes/HU-102-pr.md:154`). | Una sección en la plantilla del PR con los puntos de la lista y su respuesta. Con eso, la lista podría ser un criterio de revisión de código. |
| Que lo que dice la documentación es verdad | El validador comprueba que lo citado existe, no que siga siendo cierto (`docs/validacion-de-la-documentacion.md:30-41`). | D2 lo cubre a mano solo para el módulo de tenderos. |
| D2 para módulos sin documento de módulo | Solo existe `docs/modulos/tenderos.md`; catálogo e ingreso no tienen uno, y nadie tiene asignado mantener el de tenderos (`docs/modulos/tenderos.md:349`). | Un documento por módulo y su responsable. |
| El visto bueno del product owner sobre la historia funcionando | No queda en el repositorio ni en GitHub. | Que se acuerde dónde queda (ver Dudas). |
| Que el portal funciona desplegado | El ambiente «laboratorio» no publica el portal y no tiene dirección (`docs/despliegue-de-laboratorio.md:20`). P1 comprueba que el paquete se construyó, no que funciona. | Un ambiente publicado, o un e2e que corra contra el paquete. |

---

## Dudas

| Duda | Por qué no se resuelve leyendo el repositorio | A quién preguntar |
|---|---|---|
| ¿La rama `main` exige una revisión aprobada antes de fusionar, y exige que «Documentación» esté en verde? | `docs/validacion-de-la-documentacion.md:10` dice que el validador bloquea la fusión; que GitHub tenga el check marcado como obligatorio y exija aprobación se configura en GitHub, no en el repositorio. Si no lo exige, R1 y D1 solo los sostiene quien comprueba el DoD. | Tech lead, administrador del repositorio en GitHub |
| ¿Ya hay corridas de «Despliegue de laboratorio» y despliegues registrados en Environments › laboratorio? ¿El ambiente tiene reglas de protección? | El workflow entró con el PR #4; no consulté GitHub para este documento. | Tech lead o DevOps |
| ¿Quién pasa una historia a «Finalizada» en Jira y, por lo tanto, comprueba R1, la segunda mitad de U1 e I1, y P1? | Ningún documento del repositorio lo asigna. La sección 2 lo deja como «quien pasa la historia a Finalizada». | Delivery manager |
| ¿Quién es el revisor del PR que comprueba U1, I1, E1, R2, D1 y D2: cualquier persona que apruebe, o un rol fijo? | `CLAUDE.md:119` dice que se integra «por pull request revisado», pero no dice quién revisa. | Tech lead |
| ¿Dónde queda el visto bueno del product owner sobre una historia terminada, y cuenta como evidencia? | Jira no es una de las evidencias que acepta este DoD y no hay otra constancia. | Product owner y delivery manager |
| Mientras no haya un workflow de e2e, ¿el equipo acepta que ninguna historia con criterios de pantalla se finalice, o decide una excepción temporal? | Este DoD responde «no» a la segunda mitad de E1 mientras falte la corrida; relajarlo es una decisión del equipo, no un hecho del repositorio. | Tech lead |
| ¿HU-102, hoy marcada como terminada, vuelve a abrirse con este DoD? ¿Se aplica a HU-101? | La sección 7 de `docs/modulos/tenderos.md` deja varias funcionalidades de HU-101 en «Parcial» (líneas 294-301), así que HU-101 tampoco cumpliría D2. | Product owner y delivery manager |
| ¿Cómo se prepara un tendero inactivo en una prueba e2e? | Ver la sección 6; ni `test-data/` ni la app lo permiten hoy. | Tech lead |
