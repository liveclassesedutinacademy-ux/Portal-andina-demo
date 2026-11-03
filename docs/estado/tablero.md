# Tablero de estado por épica · Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este documento son inventados.

## 1. Fecha de corte

Repositorio leído en `main` = `933797465d8494c222168a6ca6ddbbc6fbf8ad95` (fusión del PR #8, 2-11-2026 19:04 UTC-5).
Jira (conector D23, proyecto PA) consultado el 2-11-2026 entre las 19:10 y las 19:26, y GitHub (conector D24, `liveclassesedutinacademy-ux/Portal-andina-demo`) entre las 19:11 y las 19:25 (UTC-5).

---

## 2. Regla de los colores

La regla mira solo evidencia: PR, revisiones, corridas, artefactos, código y documentos de `main`, y los errores de Jira por su **vínculo** con una historia (no por su estado). Una historia pertenece a la épica que Jira le da como padre. El estado de Jira («Finalizada», «En curso»…) no entra en la regla.

| Color | Qué tiene que haber o faltar |
|---|---|
| **Verde** | Todas las historias de la épica tienen los ocho criterios del DoD (`docs/definition-of-done.md:32-39`) en «sí» o «no aplica», y ningún error vinculado a esas historias sigue visible en el código o en el documento de módulo de `main`. |
| **Rojo** | Al menos una historia de la épica cuyo código ya está en `main` (PR fusionado) tiene evidencia de que un criterio de aceptación **no funciona**: un error vinculado a esa historia cuya falla sigue en el código de `main`, o una fila «Pendiente» en §7 del documento de módulo que corresponde a un criterio de la historia. Un error vinculado solo a historias sin código en `main`, o a historias de otra épica, no pone la épica en rojo. |
| **Amarillo** | Ni verde ni rojo: no hay defecto demostrado en las historias de la épica, pero al menos una no tiene el DoD completo (algún criterio en «no» o «sin comprobar»), incluidas las historias sin ningún PR. **Amarillo no dice que haya avance:** el tablero dice en cada caso si hay algo entregado. |

Respuestas por criterio: **sí**; **no** = la evidencia muestra que no se cumple o que falta; **sin comprobar** = la evidencia puede existir pero los conectores no la muestran (va a «Dudas»); **no aplica**.

---

## 3. Tablero por épica

| Épica | Clave | Semáforo | Historias y errores que la componen (Jira, padre) | Evidencia que la pone en ese color |
|---|---|---|---|---|
| Cartera de tenderos del vendedor | PA-5 | 🔴 **Rojo** | Historias PA-8 (HU-101), PA-9 (HU-102), PA-10 (HU-103), PA-11 (HU-104). Errores PA-14, PA-15, PA-16, PA-17 | **PA-14** (PC-01), vinculado a PA-9, cuyo PR #2 está fusionado en `main` (`9ffce96`): guardar desde el formulario de edición siempre falla; `apps/web/src/lib/api.ts:54-55` envía el `PUT` sin `?vendedorId=` y `apps/api/src/routes/tenderos.ts:125-128` responde 400 «Falta el vendedor.»; fila «Pendiente» en `docs/modulos/tenderos.md:320`. **PA-15** (PC-07), vinculado a PA-9: tras guardar no vuelve a la lista con «Datos actualizados»; `apps/web/src/pages/EditarTendero.tsx:37` solo pone «Datos guardados» en la misma pantalla (fila «Pendiente» en `docs/modulos/tenderos.md:323`). **PA-16** (PC-08), vinculado a PA-9 y PA-11: `GET /api/tenderos/:id` no pide vendedor ni comprueba la zona (`apps/api/src/routes/tenderos.ts:102-114`). Fuentes: Jira (`issuelinks`, `parent`), GitHub (`list_pull_requests`, `list_branches`: ninguna rama ni PR fusionado corrige estos errores; `hu-102-formulario` sigue en `4322ac6` sin PR) y el código de `main` |
| Catálogo del vendedor | PA-6 | 🟡 **Amarillo** (sin avance) | Historia PA-12 (HU-105). Ningún error | No hay defecto porque no hay nada entregado: ningún PR (#1 a #8) ni rama nombra HU-105 (GitHub, `list_pull_requests` y `list_branches`); los ocho criterios del DoD responden «no». Ningún error de Jira tiene PA-6 como padre ni está vinculado a PA-12 (Jira) |
| Pedidos del tendero | PA-7 | 🟡 **Amarillo** (sin avance) | Historia PA-13 (HU-106). Ningún error | Igual que PA-6: ningún PR ni rama nombra HU-106 (GitHub); ningún error vinculado (Jira). Sus criterios piden pago en línea y envío al ERP (`docs/historias/backlog-sprint-1.md:96-99`), que hoy no tienen ni PR ni activo en la matriz (ver Dudas) |

PA-17 (PC-14, lista con inactivos y «Editar») está vinculado a PA-8 y sigue visible (`docs/modulos/tenderos.md:345`), pero no hace falta para el rojo de PA-5: PA-14 y PA-15 bastan. No afecta a PA-6 ni a PA-7.

### 3.1 Criterios del DoD por historia

Fuentes: **GH-PR** = `pull_request_read` (`get`, `get_reviews`, `get_commits`); **GH-Actions** = `actions_list` (19 corridas, jobs, artefactos) y `get_job_logs`; **GH-ramas** = `list_branches`; **archivo** = repositorio en `9337974`.

| Historia | U1 | I1 | E1 | R1 | R2 | D1 | D2 | P1 |
|---|---|---|---|---|---|---|---|---|
| PA-8 · HU-101 (PR #1) | **No**: no hay corrida de «Despliegue de laboratorio» sobre el commit de fusión `b404821` (la primera es #1, id 41211757346, sobre `77a0d05`) (GH-Actions) | **No**: falta la corrida del commit de fusión `b404821` (GH-Actions). Además, la tabla del cuerpo del PR #1 no tiene pares para los `res.status` del `GET /api/tenderos` que llama la lista de CA25; solo cita el `GET` en CA2, sin sus códigos de error (GH-PR) | **No**: ningún workflow corre `npm run test:e2e` (`docs/definition-of-done.md:34`, `docs/despliegue-de-laboratorio.md:24`) | **No**: aprobación 5369821277 sobre `c34eecb` (30-09 17:38 UTC), anterior al último commit `5e84a8f` (18:51 UTC) (GH-PR) | **No**: la fila de CA14 no da línea en «Dónde se cumple», solo el archivo de la migración 002 (cuerpo del PR #1; `docs/planes/HU-101-pr.md:99`) | **No**: no hay corrida de «Documentación» sobre `5e84a8f`; la primera es sobre `5ace6d2` (31-10) (GH-Actions) | **No**: la tabla del PR no cita `docs/modulos/tenderos.md`, que no existía al fusionar (GH-PR) | **Sin comprobar**: corridas en verde y artefacto en `main` posterior (la última: #6, id 41550224601, sobre `9337974`, artefacto `portal-andina-933797465d8494c222168a6ca6ddbbc6fbf8ad95`, id 13191905368); el registro en Environments › laboratorio no lo muestra el conector |
| PA-9 · HU-102 (PR #2) | **No**: la acción «guardar» no tiene prueba (`apps/web/test/EditarTendero.test.tsx:23-49` solo prueba la carga); no hay corrida sobre el commit de fusión `9ffce96` (archivo, GH-Actions) | **No**: el 400 «Identificador inválido» de `GET /api/tenderos/:id` no tiene prueba (`docs/modulos/tenderos.md:343`) y esa ruta no comprueba la zona (archivo) | **No**: no hay e2e de la edición (`docs/modulos/tenderos.md:348`; `e2e/` solo tiene navegación, registro y búsqueda) | **No**: sigue registrada la revisión 5370373162 «Changes requested» sobre `6d5567a`, aunque hay una aprobación posterior (5370567204) sobre `f14e26a` (GH-PR) | **No**: CA1 y CA18 «fuera de este cambio» sin otro PR (`docs/planes/HU-102-pr.md:43`, `docs/planes/HU-102-pr.md:60`); CA16 deja el formulario fuera (`docs/planes/HU-102-pr.md:58`) | **No**: no hay corrida de «Documentación» sobre `f14e26a` (GH-Actions) | **No**: filas «Pendiente» (`docs/modulos/tenderos.md:320-323`) | **Sin comprobar**: como en HU-101 (corrida #6 y artefacto 13191905368). Aunque estuviera, solo diría que el paquete se construyó (`docs/definition-of-done.md:41`) |
| PA-10 · HU-103 (PR #3) | **No**: las pruebas de componente comparan solo la URL, no el método (`apps/web/test/BusquedaTenderos.test.tsx:38`, `apps/web/test/BusquedaTenderos.test.tsx:73`), y `esquemaBusqueda` no tiene prueba unitaria: solo se ejerce levantando la API. `comparable` sí tiene la suya (`apps/api/test/busqueda-tenderos.test.ts:21-25`, sin API ni base). La segunda mitad sí: paso «Pruebas de la API y de la web» en verde en «Despliegue de laboratorio» #4 (id 41250294810, commit `d1f6603`) (archivo, GH-Actions) | **No**: la tabla del PR no tiene los pares `res.status`/`it` (`docs/planes/HU-103-pr.md:17`); la segunda mitad sí, en la corrida #4 | **No**: como en HU-101 | **No**: el PR #3 no tiene ninguna revisión (`get_reviews` vacío) y lo fusionó su autor (`merged_by`) (GH-PR) | **No**: la tabla no tiene columna «Dónde se cumple» (`docs/planes/HU-103-pr.md:17`) | **Sí**: «Documentación» #2 (id 41180728092, job `validar` 124477428657) sobre `ec2dc90`, último commit del PR; el log del paso «Validar la documentación» muestra C1 a C7 en ✓ y «La documentación está al día»; artefacto `informe-documentacion` (id 13034194802) (GH-Actions, `get_job_logs`). Ver 3.2 y Dudas | **No**: la fila «Hecho» (`docs/modulos/tenderos.md:306`) cambió en el PR, pero la tabla de criterios no la cita | **Sin comprobar**: corrida #4 sobre `d1f6603` (fusión del PR #3) en verde, artefacto `portal-andina-d1f6603923a29b183ce26d4ec02a28c3efa14637` (id 13060827707); el registro en Environments no lo muestra el conector |
| PA-11 · HU-104 | **No** | **No** | **No** | **No** | **No** | **No** | **No** | **No** — en todos: no hay PR ni rama (GH-PR, GH-ramas) |
| PA-12 · HU-105 | **No** | **No** | **No** | **No** | **No** | **No** | **No** | **No** — ídem |
| PA-13 · HU-106 | **No** | **No** | **No** | **No** | **No** | **No** | **No** | **No** — ídem |

Ninguna corrida falló: las 19 corridas de los dos workflows terminan en `success` (GH-Actions). Lo que falta es evidencia, no pruebas en rojo.

### 3.2 Datos que se contradicen y qué dato tomé

| Contradicción | Qué tomé y por qué |
|---|---|
| Jira da a PA-10 (HU-103) resolución «Listo» el 31-10-2026 a las 04:15 (UTC-5); GitHub dice que el PR #3 se fusionó el 31-10-2026 a las 22:55 UTC (17:55 UTC-5) | Tomé GitHub: el commit de fusión `d1f6603` está en `main` con esa hora. Jira declaró terminada la historia unas 13 horas antes de que su código entrara a `main` y de su primera corrida de despliegue (#4). PA-8 y PA-9 se resolvieron el mismo 31-10 a las 04:15, un mes después de fusionar sus PR (30-09). El historial de cambios de Jira (`getJiraIssue`, `changelog`) muestra que las tres pasaron de «Idea» directamente a «Done» en 15 segundos (04:15:05, 04:15:17 y 04:15:20), con la misma cuenta, sin pasar por «En curso» y sin comentarios ni enlaces a GitHub |
| `list_pull_requests` devuelve `merged: false` para los PR #1 a #8, con `merged_at` lleno; `pull_request_read get` devuelve `merged: true` y `merged_by` (comprobado en #1 y #3) | Tomé «fusionado»: el detalle de un PR trae `merged_by`, y los commits de fusión están en `main` |
| El cuerpo del PR #3 dice «no se fusiona»; GitHub registra la fusión | Tomé la fusión registrada |
| El enlace de evidencia responde D1 de HU-103 «no» porque no pudo leer `porCheck` (`docs/estado/evidencia-por-historia.md:84`); el log del job `validar` muestra los siete controles en ✓ | Tomé el log: es la salida de la misma corrida y del mismo script que escribe el informe, y muestra lo que pide D1 (cero incumplimientos por control). No leí el campo `porCheck` (ver Dudas) |
| El enlace de evidencia responde P1 «no» en HU-101 a HU-103 (`docs/estado/evidencia-por-historia.md:56`, `:71`, `:86`) porque no ve el registro en Environments | No es un dato distinto, es otra escala: con las definiciones de este tablero la corrida y el artefacto existen y lo que falta es lo que el conector no muestra, así que P1 es «sin comprobar» |
| Jira vincula PA-17 (PC-14) a PA-8; el DoD lo relaciona con CA16 de HU-102 (`docs/definition-of-done.md:103`) | Tomé el vínculo de Jira. Las dos historias están en PA-5, así que no cambia ningún semáforo |
| Cambios después de la fecha de corte del enlace de evidencia (842fca7, 2-11 17:51) | Solo el PR #8 (el propio enlace de evidencia) y sus corridas: «Documentación» #12 y #13 y «Despliegue de laboratorio» #6, todas en verde. Jira no cambió (última actualización de PA-5 a PA-17: 31-10-2026). La rama `hu-102-formulario` sigue en `4322ac6`. Ninguna historia cambia de respuesta salvo D1 de HU-103 |

---

## 4. Historias terminadas sin verificar

Las tres historias que Jira declara «Finalizada». Ninguna tiene el DoD completo.

| Historia | Qué declara Jira | Qué muestra la evidencia | Qué falta |
|---|---|---|---|
| PA-8 · HU-101 · Registro de tenderos | «Finalizada», resolución «Listo» (31-10-2026 04:15 UTC-5) | PR #1 fusionado el 30-09 (`b404821`); flujo principal con e2e escrito y fila «Hecho» (`docs/modulos/tenderos.md:311-312`); corridas posteriores en verde (#6 sobre `9337974`); error vinculado abierto PA-17 (`docs/modulos/tenderos.md:345`) | Corrida sobre el commit de fusión (U1, I1); pares `res.status`/`it` (I1); corrida de e2e (E1); aprobación posterior al último commit (R1); línea de CA14 (R2); corrida de «Documentación» sobre `5e84a8f` (D1); filas de §7 citadas en el PR (D2); registro en Environments (P1, sin comprobar) |
| PA-9 · HU-102 · Edición de datos del tendero | «Finalizada», resolución «Listo» (31-10-2026 04:15 UTC-5) | PR #2 fusionado con solo los pasos 1 a 3 (la API); **guardar desde el formulario no funciona** (PA-14: `apps/web/src/lib/api.ts:54-55`, `apps/api/src/routes/tenderos.ts:125-128`); tres errores vinculados abiertos (PA-14, PA-15, PA-16); los pasos 4 a 7 están en `hu-102-formulario` (`4322ac6`) sin PR, sin revisión y sin corrida | Todo el DoD: prueba de guardar (U1); pruebas del `GET /api/tenderos/:id` (I1); e2e de la edición y su corrida (E1); PR sin «Changes requested» (R1); PR fusionado para CA1, CA16 y CA18 (R2); corrida de «Documentación» (D1); filas de §7 en «Hecho» (D2); registro en Environments (P1, sin comprobar). Sobre todo, que funcione: PA-14 y PA-15 |
| PA-10 · HU-103 · Búsqueda por nombre de tienda | «Finalizada», resolución «Listo» (31-10-2026 04:15 UTC-5), **antes** de que el PR #3 se fusionara (17:55 UTC-5) | PR #3 fusionado por su autor sin ninguna revisión; corrida #4 en verde sobre la fusión `d1f6603`; «Documentación» #2 en verde sobre `ec2dc90`; e2e escrito y fila «Hecho» (`docs/modulos/tenderos.md:306`); propuestas P1 a P6 sin aprobar (`docs/planes/HU-103-decisiones-propuestas.md:5`) | Comparar el método y prueba unitaria de `esquemaBusqueda` (U1); pares en la tabla (I1); corrida de e2e (E1); una revisión «Approved» de otra persona (R1); columna «Dónde se cumple» (R2); cita de §7 en la tabla (D2); registro en Environments (P1, sin comprobar) |

PA-11 está «En curso» y PA-12 y PA-13 en «Tareas por hacer»: Jira no las declara terminadas, así que no van aquí.

---

## 5. Vista por riesgo

### 5.1 Sin evidencia

| Historia | Evidencia que la pone aquí | Decisión que habilita | Quién la toma |
|---|---|---|---|
| PA-9 · HU-102 (CA1, CA16 en el formulario, CA18) | Filas «fuera de este cambio» sin otro PR (`docs/planes/HU-102-pr.md:43`, `docs/planes/HU-102-pr.md:58`, `docs/planes/HU-102-pr.md:60`); la rama `hu-102-formulario` (`4322ac6`) no tiene PR (GH-ramas, GH-PR) | Reabrir HU-102 y decidir si la rama `hu-102-formulario` se abre como PR o se rehace | Delivery manager (reabrir) y tech lead (rama) |
| PA-11 · HU-104 | Ningún PR ni rama (GH-PR #1 a #8, GH-ramas). Depende de `GET /api/tenderos/:id` (`docs/historias/backlog-sprint-1.md:73`), que tiene PA-16 abierto | Si se compromete para la próxima entrega, decidir antes qué responde `GET /api/tenderos/:id` sobre la zona (`docs/modulos/tenderos.md:356`) | Product owner y tech lead |
| PA-12 · HU-105 | Ningún PR ni rama. Sus criterios no se pueden comprobar («más fácil de usar», «carga rápido»: `docs/historias/backlog-sprint-1.md:83-86`) | Reescribir los criterios antes de planificarla; sin eso ningún DoD la puede cerrar | Product owner |
| PA-13 · HU-106 | Ningún PR ni rama. Pide pagos y envío al ERP (`docs/historias/backlog-sprint-1.md:96-99`) | Decidir el alcance y si entra en el sprint; los datos del ERP necesitan su fila en la matriz antes de usarse (`CLAUDE.md:38`, regla 20) | Product owner y delivery manager |

### 5.2 Pruebas fallidas o que no corren

No hay pruebas fallidas: las 19 corridas terminan en `success` (GH-Actions). El riesgo es lo que no corre o no existe.

| Historia | Evidencia que la pone aquí | Decisión que habilita | Quién la toma |
|---|---|---|---|
| PA-8, PA-9 y PA-10 | Ningún workflow corre `npm run test:e2e` (`docs/definition-of-done.md:34`, `docs/despliegue-de-laboratorio.md:24`); los e2e existen para HU-101 y HU-103 (`e2e/registro-tendero.spec.ts:28`, `e2e/busqueda-tenderos.spec.ts:31`) pero solo hay salidas pegadas por los autores | Agregar un workflow de e2e o aceptar una excepción temporal a la segunda mitad de E1 (`docs/definition-of-done.md:160`) | Tech lead |
| PA-8 y PA-9 | Sus commits de fusión (`b404821`, `9ffce96`) no tienen ninguna corrida: los workflows se crearon el 31-10 (GH-Actions) | Aceptar o no una corrida posterior de `main` como evidencia de U1 e I1 | Tech lead (autor del DoD) |
| PA-9 | La acción «guardar» no tiene prueba (`apps/web/test/EditarTendero.test.tsx:23-49`); el 400 de `GET /api/tenderos/:id` tampoco (`docs/modulos/tenderos.md:343`); no hay e2e de la edición (`docs/modulos/tenderos.md:348`). Por eso PA-14 pasa todas las corridas | Priorizar la corrección de PA-14 y PA-15 con sus pruebas antes de volver a declararla terminada | Tech lead y delivery manager |

### 5.3 Despliegues pendientes

| Historia | Evidencia que la pone aquí | Decisión que habilita | Quién la toma |
|---|---|---|---|
| PA-8, PA-9 y PA-10 | Corrida y artefacto existen (la última, «Despliegue de laboratorio» #6, id 41550224601, commit `9337974`, artefacto `portal-andina-933797465d8494c222168a6ca6ddbbc6fbf8ad95`), pero el registro en Environments › laboratorio que pide P1 (`docs/definition-of-done.md:39`) no lo muestra el conector | Confirmar en Environments › laboratorio el despliegue exitoso; con eso P1 pasa a «sí» en las tres | DevOps o tech lead |
| PA-9 (pasos 4 a 7) | Están en `hu-102-formulario` (`4322ac6`) sin PR: «una historia cuyo pull request no está fusionado no está desplegada» (`docs/despliegue-de-laboratorio.md:25`) | Si la corrección de PA-14 y PA-15 sale de esa rama, abrir su PR para que entre a `main` y se despliegue | Tech lead |

---

## 6. Qué se le puede decir a Distribuidora Andina el viernes

1. Ninguna de las tres historias que dábamos por terminadas (registro, edición y búsqueda de tenderos) cumple todavía nuestra Definition of Done: les falta revisión, corrida de pruebas de punta a punta o registro del despliegue (§3.1; Jira PA-8, PA-9, PA-10).
2. El registro y la búsqueda de tenderos están construidos, en `main` y con sus pruebas automáticas en verde en cada despliegue; sus pruebas de punta a punta existen pero aún no corren en ningún workflow (corrida #6, id 41550224601; `docs/modulos/tenderos.md:306`, `docs/modulos/tenderos.md:311`; `docs/despliegue-de-laboratorio.md:24`).
3. La edición de datos del tendero no se puede usar desde el portal: guardar siempre falla, aunque la API de edición sí funciona (PA-14; `apps/web/src/lib/api.ts:54-55`, `apps/api/src/routes/tenderos.ts:125-128`).
4. Hay un hueco de seguridad abierto: la consulta de un tendero no comprueba que sea de la zona del vendedor, y el detalle del tendero (HU-104) usa esa misma consulta (PA-16; `apps/api/src/routes/tenderos.ts:102-114`; `docs/historias/backlog-sprint-1.md:73`).
5. El catálogo (PA-6) y los pedidos del tendero (PA-7) no han empezado: no hay ningún pull request ni rama de esas historias (GitHub, PR #1 a #8 y ramas).

---

## Dudas

| Duda | Por qué no se resuelve con los conectores o leyendo el repositorio | A quién preguntar |
|---|---|---|
| P1 de PA-8, PA-9 y PA-10 (sin comprobar): ¿las corridas de «Despliegue de laboratorio» (#1 a #6; para HU-103 la #4, id 41250294810) quedaron registradas como despliegues exitosos en Environments › laboratorio? | El conector de GitHub no tiene herramienta de ambientes ni de despliegues. El job `desplegar` terminó en verde y guardó el artefacto, pero eso no muestra el registro. Para comprobarlo: abrir Environments › laboratorio y ver el despliegue de `d1f6603` o de un commit posterior | DevOps o tech lead |
| D1 de PA-10: ¿basta el log del job `validar` (C1 a C7 en ✓) o hay que leer el campo `porCheck` del artefacto 13034194802? | El conector solo da un enlace de descarga del artefacto y la tarea prohíbe abrirlo por otra vía. El DoD nombra el artefacto (`docs/definition-of-done.md:37`). Si exige el artefacto, D1 pasa a «sin comprobar» | Tech lead (autor del DoD) |
| ¿Una corrida de `main` posterior al commit de fusión cuenta para la segunda mitad de U1 e I1 de PA-8 y PA-9? | U1 pide la corrida «del commit de fusión» (`docs/definition-of-done.md:32`); P1 sí acepta «uno posterior» (`docs/definition-of-done.md:39`). Si se acepta, la corrida #6 cubriría esa mitad; las otras partes de U1 e I1 siguen en «no» | Tech lead |
| En el PR #2, ¿la aprobación posterior del mismo revisor deja sin efecto su «Changes requested» para R1? | GitHub sigue listando la revisión 5370373162; R1 pide que no haya ninguna (`docs/definition-of-done.md:35`). No cambia el rojo de PA-5 | Tech lead |
| ¿Con qué evidencia y con qué criterio se pasaron PA-8, PA-9 y PA-10 de «Idea» a «Done» el 31-10 a las 04:15, y por qué PA-10 antes de que su PR se fusionara? | El historial de Jira muestra quién y cuándo (la cuenta «Teacher Edutin Academy», las tres en 15 segundos; ver 3.2), pero no registra ninguna evidencia: las tres no tienen comentarios ni enlaces remotos | Delivery manager y la persona de esa cuenta |
| ¿PA-17 (PC-14) va vinculado a PA-8, como dice Jira, o también a PA-9 y PA-10? La búsqueda de HU-103 también devuelve inactivos (`apps/api/test/busqueda-tenderos.test.ts:87`) | Jira y el DoD dicen cosas distintas y la historia de la búsqueda no lo decide | Quien maneja el tablero de Jira y product owner |
| ¿La rama `hu-102-formulario` (`4322ac6`, pasos 4 a 7 de HU-102) se va a abrir como PR? | Existe sin PR desde el 30-09; sus commits dicen corregir PA-14 y PA-15, pero sin revisión ni corrida no es evidencia | Tech lead |
| ¿Qué debe responder `GET /api/tenderos/:id` con un tendero de otra zona (PA-16)? | Ninguna historia ni decisión lo dice (`docs/modulos/tenderos.md:356`), y HU-104 depende de esa ruta | Tech lead y product owner |
| ¿Qué criterios comprobables tiene HU-105 (PA-12)? | Los del backlog no se pueden comprobar con ninguna evidencia (`docs/historias/backlog-sprint-1.md:83-86`) | Product owner |
| ¿HU-106 (PA-13) entra en el alcance del portal, con pagos y ERP? | Usaría datos del ERP que no tienen fila en la matriz (regla 20) y ningún conector al ERP está permitido (regla 15) | Product owner y delivery manager |
| ¿Cuenta como «tabla de criterios del PR» la de `docs/planes/HU-103-pr.md`, si el cuerpo del PR #3 solo apunta a ese archivo? | El DoD habla de la descripción del PR; respondí con el archivo, que está en el PR | Tech lead |

Las diferencias con Jira (tres historias «Finalizada» sin el DoD completo, y PA-10 resuelta antes de la fusión) se las lleva una persona a quien maneja el tablero de Jira. No cambié nada en Jira ni en GitHub.
