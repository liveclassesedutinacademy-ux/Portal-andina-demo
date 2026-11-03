# Evidencia por historia · Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este documento son inventados.

## 1. Para qué sirve y fecha de corte

Enlaza cada historia de Jira (PA-8 a PA-13) con su pull request, su corrida y su despliegue, y aplica el DoD (`docs/definition-of-done.md:30-39`) para decir si la cumple.
Repositorio leído en `main` = `842fca7a5956fb690900568d968795da5c2f6007` (fusión del PR #7, 31-10-2026 17:58 UTC-5).
Jira (conector D23, proyecto PA) y GitHub (conector D24, `liveclassesedutinacademy-ux/Portal-andina-demo`) consultados el 2-11-2026 entre las 17:39 y las 17:51 (UTC-5).

---

## 2. Resumen

| Historia | Clave en Jira | Estado en Jira | Pull request | Corrida | Despliegue | ¿Cumple el DoD? | Qué le falta |
|---|---|---|---|---|---|---|---|
| HU-101 · Registro de tenderos | PA-8 | Finalizada (resolución «Listo») | #1, fusionado el 30-09-2026 en `b404821` | Ninguna sobre `b404821` ni sobre el último commit del PR (`5e84a8f`): los dos workflows se crearon el 31-10-2026 | «Despliegue de laboratorio» #1 (id 41211757346) sobre `77a0d05`, posterior en `main`; artefacto `portal-andina-77a0d05ce83e789972cbb959ed49a8423dd538b1` | **No** | U1, I1 (corrida del commit de fusión); E1 (corrida e2e); R1 (aprobación anterior al último commit); R2 (CA14 sin línea); D1; D2; P1 (registro del despliegue en Environments › laboratorio, que no se pudo ver) |
| HU-102 · Edición de datos del tendero | PA-9 | Finalizada (resolución «Listo») | #2, fusionado el 30-09-2026 en `9ffce96` (solo pasos 1 a 3 del plan) | Ninguna sobre `9ffce96` ni sobre el último commit del PR (`f14e26a`) | «Despliegue de laboratorio» #1 (id 41211757346) sobre `77a0d05`, posterior en `main`; artefacto `portal-andina-77a0d05ce83e789972cbb959ed49a8423dd538b1` | **No** | U1 (guardar sin prueba), I1, E1 (sin e2e de la edición), R1 (revisión «Changes requested» registrada), R2 (CA1 y CA18 «fuera de este cambio» sin otro PR), D1, D2 (filas «Pendiente»), P1 (registro del despliegue en Environments › laboratorio, que no se pudo ver) |
| HU-103 · Búsqueda de tenderos por nombre de tienda | PA-10 | Finalizada (resolución «Listo») | #3, fusionado el 31-10-2026 en `d1f6603` | «Documentación» #2 (id 41180728092) sobre `ec2dc90` (último commit del PR); «Despliegue de laboratorio» #4 (id 41250294810) sobre `d1f6603` | «Despliegue de laboratorio» #4 sobre `d1f6603`; artefacto `portal-andina-d1f6603923a29b183ce26d4ec02a28c3efa14637` | **No** | U1 (no compara el método; sin unitaria de la validación), I1 (sin pares en la tabla), E1 (corrida e2e), R1 (sin revisiones), R2 (sin columna «Dónde se cumple»), D1 (no se pudo leer el informe del artefacto), D2 (la tabla no cita §7), P1 (registro del despliegue en Environments › laboratorio, que no se pudo ver) |
| HU-104 · Detalle del tendero | PA-11 | En curso | No tiene | No tiene | No tiene | No | Todo: no hay PR ni rama de la historia |
| HU-105 · Mejorar el catálogo | PA-12 | Tareas por hacer | No tiene | No tiene | No tiene | No | Todo: no hay PR |
| HU-106 · Pedidos del tendero en el portal | PA-13 | Tareas por hacer | No tiene | No tiene | No tiene | No | Todo: no hay PR |

Ninguna historia cumple el DoD. Las tres «Finalizada» tienen criterios de pantalla, así que ninguna puede cumplir hoy la segunda mitad de E1: ningún workflow corre `npm run test:e2e` (`docs/definition-of-done.md:34`, `docs/despliegue-de-laboratorio.md:24`).

### Por qué cada pull request es el de su historia

| Historia | PR | Por qué es el suyo |
|---|---|---|
| PA-8 (HU-101) | #1 | Título «HU-101 · Registro de tenderos», igual al resumen de PA-8; rama `hu-101-registro-tenderos`; la descripción dice «HU-101 «Registro de tenderos»» y enlaza `docs/historias/HU-101-registro-de-tenderos.md` (GitHub, `pull_request_read get`) |
| PA-9 (HU-102) | #2 | Título «HU-102 · Edición de datos del tendero: endpoint PUT /api/tenderos/:id (pasos 1 a 3)»; rama `hu-102-edicion-tendero`; la descripción enlaza la historia y el plan de HU-102 y dice que cubre solo los pasos 1, 2 y 3 (`docs/planes/HU-102-pr.md:7`) |
| PA-10 (HU-103) | #3 | Título «Hu 103 Búsqueda de tenderos por nombre de tienda»; rama `hu-103-busqueda-tenderos`; el cuerpo en GitHub solo dice «Descripción completa en docs/planes/HU-103-pr.md», y ese archivo, que está en el PR, cita la historia (`docs/planes/HU-103-pr.md:7`) |
| PA-11, PA-12, PA-13 | — | Ningún PR (#1 a #7) ni rama de GitHub nombra HU-104, HU-105 o HU-106. Los PR #4 a #7 son de despliegue, conectores y DoD |

Jira no tiene enlaces remotos a GitHub en PA-8, PA-9 ni PA-10 (`getJiraIssueRemoteIssueLinks` devuelve vacío): el enlace historia–PR sale solo de títulos, ramas y descripciones.

---

## 3. Detalle por historia

Fuentes abreviadas: **Jira** = conector D23; **GH-PR** = conector D24, `pull_request_read`; **GH-Actions** = conector D24, `actions_list` (corridas, jobs y artefactos); **GH-ramas** = conector D24, `list_branches`; **git** = el repositorio local en `842fca7`.

### 3.1 HU-101 · Registro de tenderos (PA-8, PR #1)

Criterios de pantalla de la historia: CA22 («cuando el vendedor guarda», `docs/historias/HU-101-registro-de-tenderos.md:114-117`) y CA25 («cuando guarda con éxito», `docs/historias/HU-101-registro-de-tenderos.md:129-132`).

| Criterio | Respuesta | Evidencia | Válida o débil | De dónde salió |
|---|---|---|---|---|
| U1 | **No** | (1) La tabla del PR cita las pruebas de CA22 y CA25 (`docs/planes/HU-101-pr.md:107`, `docs/planes/HU-101-pr.md:110`), y la prueba compara URL y método del `POST` (`apps/web/test/RegistrarTendero.test.tsx:52-53`). (2) **Falta:** no hay corrida de «Despliegue de laboratorio» sobre el commit de fusión `b404821`; el workflow se creó el 31-10-2026 y su primera corrida es sobre `77a0d05` | (1) válida; (2) no existe | GH-PR (descripción), archivo; GH-Actions (lista de 16 corridas) |
| I1 | **No** | La tabla da rangos de «Dónde se cumple» y pruebas por abreviatura (REG:281, REG:290), pero no los pares línea de `res.status(...)` / línea de `it(...)` que pide `docs/definition-of-done.md:33`, y sus líneas son de `b1550f4`, no del último commit (`docs/planes/HU-101-pr.md:81`). Falta además la corrida del commit de fusión | No hay evidencia válida | GH-PR; GH-Actions |
| E1 | **No** | (1) Los `test(...)` de CA25 y CA22 existen: `e2e/registro-tendero.spec.ts:28` y `e2e/registro-tendero.spec.ts:40`, citados en la tabla. (2) **Falta** la corrida que muestre que pasan: solo hay salida pegada por el autor | (1) válida; (2) débil (salida pegada) | GH-PR; archivo |
| R1 | **No** | Aprobación de `edutinacademyteacher-dot` (revisión 5369821277) sobre `c34eecb` a las 17:38 UTC del 30-09; el último commit del PR, `5e84a8f` («HU-101: pruebas manuales y capturas»), es de las 18:51 UTC. La aprobación es anterior al último commit | Válida (muestra que no se cumple) | GH-PR (`get_reviews`, `get_commits`) |
| R2 | **No** | La tabla tiene las 25 filas (`docs/planes/HU-101-pr.md:84-110`) y CA22 y CA25 citan `apps/web/src/` y `e2e/`, pero la fila de CA14 no da línea en «Dónde se cumple» (solo el archivo de la migración 002, `docs/planes/HU-101-pr.md:99`) | Válida (muestra que no se cumple) | GH-PR (descripción) |
| D1 | **No** | No hay corrida de «Documentación» sobre `5e84a8f`: el workflow se creó el 31-10-2026 y su primera corrida es sobre `5ace6d2` | No existe | GH-Actions |
| D2 | **No** | La tabla del PR no cita ninguna línea de `docs/modulos/tenderos.md`, que no existía al fusionar (se creó en `6115adb`, 30-10-2026). Hoy las filas de CA25 y CA22 dicen «Hecho» con e2e (`docs/modulos/tenderos.md:311-312`), pero no están en el diff del PR | No hay evidencia válida | GH-PR; archivo; git |
| P1 | **No** | La corrida y el artefacto existen: «Despliegue de laboratorio» #1 (id 41211757346), job `desplegar` en verde sobre `77a0d05`, que contiene `b404821` (git: `merge-base --is-ancestor`); artefacto `portal-andina-77a0d05ce83e789972cbb959ed49a8423dd538b1` (id 13046034434). El job declara el ambiente `laboratorio` (`.github/workflows/despliegue-laboratorio.yml:18-20`). **Falta** la evidencia que pide P1: el despliegue registrado en Environments › laboratorio (`docs/definition-of-done.md:39`), que el conector no muestra. Que la corrida lo haya registrado es una deducción (ver Dudas) | Corrida y artefacto válidos; el registro del despliegue no se pudo comprobar | GH-Actions; git; archivo |

### 3.2 HU-102 · Edición de datos del tendero (PA-9, PR #2)

Criterios de pantalla: entre otros CA1 («elige editar», `docs/historias/HU-102-edicion-de-datos-del-tendero.md:11-14`), CA2 («cambia el teléfono… y guarda», `docs/historias/HU-102-edicion-de-datos-del-tendero.md:16-19`), CA16 (`docs/historias/HU-102-edicion-de-datos-del-tendero.md:86-89`) y CA18 («vuelve a la lista», `docs/historias/HU-102-edicion-de-datos-del-tendero.md:96-99`).

| Criterio | Respuesta | Evidencia | Válida o débil | De dónde salió |
|---|---|---|---|---|
| U1 | **No** | La acción «guardar» no tiene prueba unitaria: `apps/web/test/EditarTendero.test.tsx:22-50` solo prueba la carga (`docs/definition-of-done.md:100`). Falta la corrida del commit de fusión `9ffce96` | Válida (muestra que no se cumple) | archivo; GH-Actions |
| I1 | **No** | La pantalla llama a `GET /api/tenderos/:id`; su 400 «Identificador inválido» no tiene prueba (PC-12, `docs/modulos/tenderos.md:343`) y la ruta no comprueba la zona (`apps/api/src/routes/tenderos.ts:102-114`). Falta la corrida del commit de fusión | Válida (muestra que no se cumple) | archivo; GH-Actions |
| E1 | **No** | No hay ningún e2e de la edición (PC-17, `docs/modulos/tenderos.md:348`); `e2e/` solo tiene navegación, registro y búsqueda | Válida (muestra que no se cumple) | archivo |
| R1 | **No** | Hay una aprobación de `edutinacademyteacher-dot` (5370567204) sobre el último commit `f14e26a`, posterior a él, pero el PR registra una revisión «Changes requested» del mismo revisor (5370373162 sobre `6d5567a`); R1 pide que no haya ninguna (`docs/definition-of-done.md:35`). Ver Dudas | Válida | GH-PR (`get_reviews`, `get_commits`) |
| R2 | **No** | CA1 y CA18 dicen «Fuera de este cambio» sin el número de otro PR fusionado (`docs/planes/HU-102-pr.md:43`, `docs/planes/HU-102-pr.md:60`); la fila de CA2 cita solo la API (`docs/planes/HU-102-pr.md:44`); CA16 deja el formulario fuera (`docs/planes/HU-102-pr.md:58`) | Válida (muestra que no se cumple) | GH-PR (descripción) |
| D1 | **No** | No hay corrida de «Documentación» sobre `f14e26a` (workflow creado el 31-10-2026) | No existe | GH-Actions |
| D2 | **No** | La tabla no cita `docs/modulos/tenderos.md`; hoy las filas de guardar, validar en el formulario, bloquear al inactivo y volver con «Datos actualizados» dicen «Pendiente» (`docs/modulos/tenderos.md:320-323`) | Válida (muestra que no se cumple) | GH-PR; archivo |
| P1 | **No** | La corrida y el artefacto existen: «Despliegue de laboratorio» #1 (id 41211757346) en verde sobre `77a0d05`, que contiene `9ffce96` (git); artefacto `portal-andina-77a0d05ce83e789972cbb959ed49a8423dd538b1`. **Falta** el despliegue registrado en Environments › laboratorio (`docs/definition-of-done.md:39`), que el conector no muestra (ver Dudas). Aunque estuviera, P1 solo diría que el paquete se construyó, no que la edición funcione (`docs/definition-of-done.md:41`) | Corrida y artefacto válidos; el registro del despliegue no se pudo comprobar | GH-Actions; git |

### 3.3 HU-103 · Búsqueda de tenderos por nombre de tienda (PA-10, PR #3)

Criterios: CA1 a CA5 de `docs/historias/backlog-sprint-1.md:51-56`; CA1 a CA4 son de pantalla (campo, escribir, lista, mensaje).

| Criterio | Respuesta | Evidencia | Válida o débil | De dónde salió |
|---|---|---|---|---|
| U1 | **No** | (1) La tabla cita las pruebas de componente (`docs/planes/HU-103-pr.md:19-22`) y estas comparan la URL que recibe `fetch` (`apps/web/test/BusquedaTenderos.test.tsx:73`), pero solo la URL: `rutasPedidas` descarta las opciones (`apps/web/test/BusquedaTenderos.test.tsx:38`), así que no se compara el método. La función de validación de la historia (`esquemaBusqueda`, `comparable`) solo se prueba en `apps/api/test/busqueda-tenderos.test.ts`, que levanta la API (no es unitaria). (2) Paso «Pruebas de la API y de la web» en verde en «Despliegue de laboratorio» #4 (id 41250294810) sobre el commit de fusión `d1f6603` | (1) válida, muestra que no se cumple; (2) válida | GH-PR (archivo de descripción); archivo; GH-Actions (jobs) |
| I1 | **No** | Las pruebas existen en el código (`apps/api/test/busqueda-tenderos.test.ts:107`, `apps/api/test/busqueda-tenderos.test.ts:113`, `apps/api/test/busqueda-tenderos.test.ts:115` para los `res.status` de `apps/api/src/routes/tenderos.ts:39`, `apps/api/src/routes/tenderos.ts:40`, `apps/api/src/routes/tenderos.ts:45`), pero la tabla del PR no tiene los pares línea de `res.status` / línea de `it` que pide la evidencia (1) de I1. (2) en verde, como en U1 | (1) falta en el PR; (2) válida | archivo; GH-Actions |
| E1 | **No** | (1) `test(...)` activos citados en la tabla: `e2e/busqueda-tenderos.spec.ts:31`, `e2e/busqueda-tenderos.spec.ts:63`, `e2e/busqueda-tenderos.spec.ts:75`. (2) Que pasan: solo la salida pegada por la autora (`docs/planes/HU-103-pr.md:116-133`) | (1) válida; (2) débil | archivo; GH-PR |
| R1 | **No** | El PR #3 no tiene ninguna revisión (`get_reviews` vacío); lo fusionó su autor | Válida (muestra que no se cumple) | GH-PR |
| R2 | **No** | La tabla de criterios tiene las columnas «Criterio · Prueba que lo comprueba · Estado» (`docs/planes/HU-103-pr.md:17`), sin «Dónde se cumple»; los criterios de pantalla no citan `apps/web/src/` en la tabla | Válida (muestra que no se cumple) | archivo de descripción del PR |
| D1 | **No** | La corrida y el artefacto existen: «Documentación» #2 (id 41180728092), job `validar` en verde sobre `ec2dc90`, último commit del PR; artefacto `informe-documentacion` (id 13034194802). **Falta** leer en ese artefacto el campo `porCheck` con cero fallos por control, que es la evidencia que pide D1 (`docs/definition-of-done.md:37`): el conector solo da un enlace de descarga externo. Que no hubo incumplimientos es una deducción: el paso corre el script directamente (`.github/workflows/documentacion.yml:23-24`) y la versión del script en `ec2dc90` sale con 1 si hay un incumplimiento (línea 233 de esa versión). Ver Dudas | Corrida y artefacto válidos; el contenido del artefacto no se pudo comprobar | GH-Actions (jobs y artefactos); git |
| D2 | **No** | La fila de la búsqueda dice «Hecho» con su e2e (`docs/modulos/tenderos.md:306`) y cambió en el diff del PR, pero la tabla de criterios del PR no cita esa línea (solo la sección 3 de la descripción la menciona) | Válida (muestra que no se cumple la forma que pide D2) | archivo |
| P1 | **No** | La corrida y el artefacto existen: «Despliegue de laboratorio» #4 (id 41250294810), job `desplegar` en verde sobre `d1f6603` (fusión del PR #3); artefacto `portal-andina-d1f6603923a29b183ce26d4ec02a28c3efa14637` (id 13060827707). **Falta** el despliegue registrado en Environments › laboratorio (`docs/definition-of-done.md:39`), que el conector no muestra (ver Dudas) | Corrida y artefacto válidos; el registro del despliegue no se pudo comprobar | GH-Actions |

### 3.4 HU-104 · Detalle del tendero (PA-11)

Sin PR, sin rama (GH-ramas: ninguna rama nombra HU-104) y sin corrida. Los criterios están en `docs/historias/backlog-sprint-1.md:68-73`; no hay archivo de historia en `docs/historias/`.

| Criterio | Respuesta | Evidencia | Válida o débil | De dónde salió |
|---|---|---|---|---|
| U1, I1, E1 | No | No hay pruebas de la pantalla de detalle ni PR | — | GH-PR; archivo |
| R1, R2 | No | No hay PR | — | GH-PR |
| D1, D2 | No | No hay PR ni corrida; `docs/modulos/tenderos.md` §7 no tiene fila del detalle | — | GH-Actions; archivo |
| P1 | No | Ningún despliegue contiene la historia | — | GH-Actions |

### 3.5 HU-105 · Mejorar el catálogo (PA-12)

Sin PR, rama ni corrida. Criterios en `docs/historias/backlog-sprint-1.md:83-86`. U1, I1, E1, R1, R2, D1, D2 y P1: **no**, por la misma razón que HU-104 (fuentes: GH-PR, GH-ramas, GH-Actions).

### 3.6 HU-106 · Pedidos del tendero en el portal (PA-13)

Sin PR, rama ni corrida. Criterios en `docs/historias/backlog-sprint-1.md:96-99`. U1, I1, E1, R1, R2, D1, D2 y P1: **no**, por la misma razón que HU-104 (fuentes: GH-PR, GH-ramas, GH-Actions).

---

## 4. Errores

| Error | Clave en Jira | Estado en Jira | Historias vinculadas en Jira | ¿Hay evidencia de que se corrigió? |
|---|---|---|---|---|
| PC-01 · Guardar desde el formulario de edición siempre falla | PA-14 | Tareas por hacer | PA-9 (HU-102) | **No.** En `main`, la fila «Guardar desde el formulario de edición» dice «Pendiente» (`docs/modulos/tenderos.md:320`) y el PUT sigue respondiendo 400 sin vendedor (`apps/api/src/routes/tenderos.ts:125-128`). La rama `hu-102-formulario` (`36967ab`, «paso 5: el formulario guarda…») dice corregirlo, pero no tiene PR ni corrida y no está en `main`: es débil |
| PC-07 · Tras editar no se vuelve a la lista con «Datos actualizados» | PA-15 | Tareas por hacer | PA-9 (HU-102) | **No.** Fila «Pendiente» (`docs/modulos/tenderos.md:323`). Los commits `36967ab` y `4322ac6` de `hu-102-formulario` lo afirman, sin PR ni corrida |
| PC-08 · La consulta de un tendero no comprueba la zona | PA-16 | Tareas por hacer | PA-9 (HU-102) y PA-11 (HU-104) | **No.** `GET /api/tenderos/:id` sigue sin pedir vendedor (`apps/api/src/routes/tenderos.ts:102-114`); sigue en pendientes (`docs/modulos/tenderos.md:339`). Ninguna rama ni PR lo toca |
| PC-14 · La lista muestra tenderos inactivos con «Editar» | PA-17 | Tareas por hacer | PA-8 (HU-101) | **No.** Sigue en pendientes (`docs/modulos/tenderos.md:345`); la búsqueda de HU-103 también devuelve inactivos. Ver Dudas: el DoD lo relaciona con HU-102 |

Observación: las descripciones de PA-14 a PA-17 citan líneas de `tenderos.ts` anteriores a HU-103 (por ejemplo, PA-14 cita las líneas 113 a 116 para el 400 «Falta el vendedor.», que hoy está en `apps/api/src/routes/tenderos.ts:125-128`). Las líneas vigentes son las de `docs/modulos/tenderos.md:332-345`.

---

## 5. Evidencias débiles que encontré y por qué no cuentan

| Evidencia | Dónde | Por qué no cuenta |
|---|---|---|
| Estado «Finalizada» y resolución «Listo» de PA-8, PA-9 y PA-10 | Jira | Es un estado, no una evidencia: Jira no es una de las evidencias que acepta el DoD (`docs/definition-of-done.md:159`) |
| Casillas «[x] npm test / lint / test:e2e pasa» y salidas pegadas del PR #1 | GH-PR #1; `docs/planes/HU-101-pr.md:114-120` | Las escribió el autor; el propio PR dice que no hay registro fuera de la descripción |
| Casillas y salidas pegadas del PR #2, incluida «67 passed · 53 skipped» | GH-PR #2; `docs/planes/HU-102-pr.md:69-107` | Salida pegada por el autor; nadie la puede abrir como corrida |
| Salidas de `npm test`, `lint`, `test:e2e` y `docs:validar` del PR #3, y la columna «Estado: Cumple» | `docs/planes/HU-103-pr.md:19-24`, `docs/planes/HU-103-pr.md:51-133` | Afirmaciones y salidas de la autora. Para la segunda mitad de U1 e I1 hay una corrida real que las reemplaza; para D1 hay corrida, pero no pude leer su informe; para E1 no hay corrida |
| Capturas de HU-101 «tomadas el 30 de septiembre» | GH-PR #1 (sección Capturas), `docs/capturas/HU-101/` | La fecha está en la descripción, no en la captura; no son corrida ni revisión. No las abrí |
| Pruebas manuales de HU-101 | `docs/planes/HU-101-pruebas-manuales.md` | Registro del autor; no es corrida de un workflow |
| Revisión «Commented» del autor en el PR #2 (5370545158) y revisión «Commented» del PR #1 (5369665684) | GH-PR | Un comentario no es una aprobación (R1) |
| Aprobación del PR #1 sobre `c34eecb` | GH-PR #1 | Es una revisión registrada, pero anterior al último commit (`5e84a8f`): no cumple R1 |
| Salida e2e pegada en el documento de módulo y en el DoD | `docs/modulos/tenderos.md:280-295`, `docs/definition-of-done.md:79-90` | Corridas locales; el propio DoD dice que no son la evidencia de E1 |
| Mensajes de los commits de `hu-102-formulario` («el formulario guarda…», «La tabla criterio–prueba de HU-102 queda sin pruebas pendientes») | GH-ramas y `list_commits` de esa rama | Afirmaciones del autor en una rama sin PR, sin revisión y sin corrida |

---

## 6. Diferencias con Jira

Para quien maneja el tablero. No cambié nada en Jira ni en GitHub.

- **PA-8 · HU-101.** Jira: «Finalizada». Evidencia: no cumple el DoD. Falta: corrida de «Despliegue de laboratorio» sobre el commit de fusión `b404821` (U1, I1); corrida que muestre que pasan los e2e (E1); una aprobación posterior al último commit del PR #1 (R1); línea de «Dónde se cumple» para CA14 (R2); corrida de «Documentación» sobre el último commit (D1); filas de §7 citadas en el PR (D2); el despliegue registrado en Environments › laboratorio (P1).
- **PA-9 · HU-102.** Jira: «Finalizada». Evidencia: el PR #2 solo cubre los pasos 1 a 3 del plan; guardar desde el formulario no funciona (PA-14 abierto). Falta: prueba unitaria de guardar (U1); prueba de integración del 400 y de la zona en `GET /api/tenderos/:id` (I1); e2e de la edición y su corrida (E1); un PR sin «Changes requested» o la aclaración de la Duda 3 (R1); un PR fusionado para CA1, CA16 (formulario) y CA18 (R2); corrida de «Documentación» (D1); filas de §7 en «Hecho» (D2); el despliegue registrado en Environments › laboratorio (P1). Además tiene tres errores abiertos vinculados (PA-14, PA-15, PA-16).
- **PA-10 · HU-103.** Jira: «Finalizada». Evidencia: no cumple el DoD. Falta: que las pruebas de componente comparen el método y una prueba unitaria de la validación (U1); pares `res.status`/`it` en la tabla (I1); corrida de los e2e (E1); una revisión «Approved» de otra persona (R1); columna «Dónde se cumple» con líneas de `apps/web/src/` (R2); el campo `porCheck` del artefacto `informe-documentacion` con cero fallos (D1); la cita de `docs/modulos/tenderos.md:306` en la tabla (D2); el despliegue registrado en Environments › laboratorio (P1). Las propuestas P1 a P6 siguen sin aprobar (`docs/planes/HU-103-decisiones-propuestas.md:5`).
- **PA-11, PA-12, PA-13.** Jira: «En curso», «Tareas por hacer», «Tareas por hacer». Evidencia: sin PR. No hay diferencia: ninguna está marcada como terminada.

---

## 7. Datos de los conectores que se contradicen

| Contradicción | Qué tomé y por qué |
|---|---|
| `list_pull_requests` devuelve `merged: false` para los PR #1 a #7, con `merged_at` lleno; `pull_request_read get` devuelve `merged: true` y `merged_by` para #1, #2 y #3 | Tomé «fusionado»: el detalle es la consulta de un solo PR, trae `merged_at` y `merged_by`, y los commits «Merge pull request #1/#2/#3» (`b404821`, `9ffce96`, `d1f6603`) están en `main` (GH `list_commits` y git) |
| La descripción del PR #2 dice que va contra `hu-101-registro-tenderos` (`docs/planes/HU-102-pr.md:9`); GitHub da como base `main` en `b404821` | Tomé la base de GitHub, que es el dato registrado; la descripción se escribió cuando el PR #1 estaba abierto |
| El cuerpo del PR #3 dice «no se fusiona»; GitHub dice que se fusionó el 31-10-2026 y hay commit de fusión `d1f6603` en `main` | Tomé la fusión registrada |
| El cuerpo del PR #1 en GitHub dice que el contrato «Ya está» en el contexto del portal; `docs/planes/HU-101-pr.md:26` dice «Todavía no está» | No es la misma versión: el cuerpo de GitHub se actualizó tras la revisión y el archivo conserva el texto original (lo dice el propio cuerpo). Tomé el cuerpo de GitHub como descripción del PR |

---

## Dudas

| Duda | Por qué no se resuelve con los conectores o leyendo el repositorio | A quién preguntar |
|---|---|---|
| ¿Las corridas 41211757346 y 41250294810 quedaron registradas como despliegues exitosos en Environments › laboratorio? | El conector de GitHub no tiene herramienta de ambientes ni de despliegues. El job `desplegar` declara el ambiente y terminó en verde, pero eso no muestra el registro; por eso P1 responde «no» en HU-101, HU-102 y HU-103. Si el registro existe, P1 pasa a «sí» en las tres | Tech lead o DevOps |
| ¿Qué dice el campo `porCheck` del artefacto `informe-documentacion` (id 13034194802)? | El conector solo da un enlace de descarga temporal fuera de GitHub, y la tarea prohíbe abrirlo por otra vía. Por eso D1 de HU-103 responde «no»; si `porCheck` tiene cero fallos en C1 a C7, pasa a «sí» | Tech lead |
| En el PR #2, ¿una aprobación posterior del mismo revisor deja sin efecto su «Changes requested» para R1? | `docs/definition-of-done.md:35` dice «no muestra ninguna revisión en estado Changes requested», y GitHub sigue listando esa revisión | Tech lead (autor del DoD) |
| ¿Cuenta como «tabla de criterios del PR» la que está en `docs/planes/HU-103-pr.md`, si el cuerpo del PR #3 en GitHub solo apunta a ese archivo? | El DoD habla de la descripción del PR; respondí con el archivo, que está en el PR | Tech lead |
| En una acción `GET` sin opciones, ¿U1 exige igual comparar el método? | `docs/definition-of-done.md:32` pide «la URL y el método»; la prueba de HU-103 compara solo la URL | Tech lead |
| ¿Quién pasó PA-8, PA-9 y PA-10 a «Finalizada» y con qué evidencia? | Jira no muestra comentarios ni enlaces en esas historias | Delivery manager |
| ¿PA-17 (PC-14) va vinculado a PA-8 (HU-101), como dice Jira, o a PA-9 (HU-102), como lo relaciona el DoD con CA16 (`docs/definition-of-done.md:103`)? | Jira y el repositorio dicen cosas distintas; no corresponde decidirlo aquí | Quien maneja el tablero y tech lead |
| ¿La rama `hu-102-formulario` (`4322ac6`, pasos 4 a 7 de HU-102) se va a abrir como PR? | Existe en GitHub sin PR; no se puede saber si alguien la retomará | Tech lead |
| ¿Cuál es la lista oficial de criterios de HU-101: los 4 de Jira y del backlog, o CA1 a CA25 de `docs/historias/HU-101-registro-de-tenderos.md`? | Usé la del archivo, que es la que enlaza el PR; Jira tiene la versión corta | Product owner |
| ¿`main` exige revisión antes de fusionar? | `list_branches` devuelve `protected: false` para `main`, y el PR #3 se fusionó sin revisión; si debe protegerse se decide en GitHub | Tech lead o administrador del repositorio |
| ¿Se actualiza la cita del DoD al criterio de «Hecho» de tenderos? | `docs/definition-of-done.md:38` lo ubica en la línea 290 de `docs/modulos/tenderos.md`, que tras HU-103 es salida de Playwright; el criterio está hoy en `docs/modulos/tenderos.md:301` | Quien mantiene el DoD |
| ¿Se aprueban las propuestas P1 a P6 de HU-103 antes de darla por terminada? | No es un criterio del DoD, pero siguen «pendientes de aprobación» (`docs/planes/HU-103-pr.md:160`) | Product owner (P2, P3) y tech lead (P1, P4, P5, P6) |
