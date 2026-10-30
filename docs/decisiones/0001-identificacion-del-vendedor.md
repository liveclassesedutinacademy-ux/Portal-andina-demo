# ADR 0001 · Identificación del vendedor por el `vendedorId` que envía el cliente

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos que aparecen aquí son inventados.

Registro escrito el 30 de octubre de 2026 a partir del código de `main` (commit `6115adb`) y de los documentos de `docs/`. Es un registro **retroactivo**: reconstruye una decisión que ya está en el código. Cada afirmación lleva su archivo y línea. Las marcas significan:

- **[Consta]**: está escrito en un documento, un comentario o un commit.
- **[Deducido]**: sale de leer el código; ningún documento lo dice.

## (1) Estado

**Propuesto.** El material no registra que alguien haya aceptado esta decisión como tal. Lo que [Consta] es que la forma de identificar al vendedor en la edición la fijó la revisión del plan de HU-102 por el tech lead (`docs/planes/HU-102-decisiones-del-equipo.md:3`, `:26`), y que el código que la aplica en la lista, el registro y la edición está fusionado en `main` (`b404821` y `9ffce96`, PR #1 y #2). Estar implementada no equivale a estar aceptada, y para la decisión de origen (`d12301e`) solo hay código. Pasa a «aceptado» cuando lo apruebe quien revise los ADR de este repositorio (ver Dudas).

**Fecha: no consta.** Ningún documento fecha la decisión. Las fechas que hay son de commits, no de la decisión: el código inicial que ya usaba `?vendedorId=` es de `d12301e` (29-09-2026) y el archivo de decisiones de HU-102 entró en `d3bb4b2` (29-09-2026). A diferencia de D12 y D13 (`HU-102-decisiones-del-equipo.md:34-35`), la fila «Identidad del vendedor» no lleva fecha de aprobación.

**Quién decidió: no consta** para la identificación por id en el código inicial (`d12301e`). Para la edición consta el tech lead (`HU-102-decisiones-del-equipo.md:3`), sin nombre.

## (2) Contexto

1. Proyecto en fase 4 (construcción), sprint 1 (`docs/contexto-del-portal.md:11`); el vendedor entra con su código y «el ingreso es simulado: no hay contraseñas» (`contexto-del-portal.md:20`; `apps/api/src/routes/sesion.ts:7`, desde `d12301e`).
2. El código inicial ya filtraba la lista con `Number(req.query.vendedorId)` (`d12301e`, `tenderos.ts:12` en esa versión). [Deducido] Ningún documento lo explica: el commit no trae documentos y la auditoría cuenta «por qué `vendedorId` sin autenticación» entre las decisiones sin registro (`docs/auditoria-documentacion.md:72`).
3. HU-101 agregó el registro, que toma el id del cuerpo (esquema en `6cdeed6`, `validaciones/tendero.ts:68`; ruta en `eab6b5c`, `tenderos.ts:52`). El PR lo señala como un endpoint que «escribe datos», de más riesgo que los `GET` existentes (`docs/planes/HU-101-pr.md:221`), y la autenticación real quedó fuera del alcance (`docs/historias/HU-101-registro-de-tenderos.md:164`).
4. El paso 3 de HU-102, «Control de zona y de estado en el endpoint» (`docs/planes/HU-102-plan.md:117`), necesitaba «el vendedor que la hace». El plan lo dejó [POR DEFINIR] porque «no hay autenticación en el sprint» (`HU-102-plan.md:122`), y el tech lead fijó `?vendedorId=` (`HU-102-decisiones-del-equipo.md:26`). `021b2d7` lo implementó con el comentario «Sin ingreso con contraseña, el vendedor llega en la consulta, igual que en la lista».
5. `fb10af4` (30-09-2026) unificó la lectura del id para la lista y la edición en `zonaDelVendedor` (`apps/api/src/routes/tenderos.ts:15-27`).

## (3) Decisión

La API identifica al vendedor por el `vendedorId` numérico que manda el cliente —en la consulta en `GET` y `PUT /api/tenderos`, en el cuerpo en `POST /api/tenderos`— sin contraseña ni comprobación de quién lo envía; la web lo obtiene de `POST /api/sesion` con el código del vendedor y lo guarda solo en memoria.

| Pieza | Dónde está implementada | Tipo |
|---|---|---|
| Ingreso con el código, sin contraseña; devuelve el vendedor con su `id` | `apps/api/src/routes/sesion.ts:5-23`; `apps/web/src/pages/Ingreso.tsx:16-17` | [Consta] comentario `sesion.ts:7`; `contexto-del-portal.md:20`; el id se obtiene con `POST /api/sesion` (`HU-101-registro-de-tenderos.md:139`) |
| Lectura del id en la consulta (lista y edición) | `apps/api/src/routes/tenderos.ts:19-27`, usada en `:34` y `:113` | [Consta] comentario `tenderos.ts:16`; `contexto-del-portal.md:55`, `:58`; `HU-102-decisiones-del-equipo.md:26` para la edición; comentario de `021b2d7` |
| Lectura del id en el cuerpo (registro) | `apps/api/src/validaciones/tendero.ts:68` (`6cdeed6`); `apps/api/src/routes/tenderos.ts:52` (`eab6b5c`) | [Consta] contrato en `docs/planes/HU-101-plan.md:21` (PT1); `contexto-del-portal.md:57` |
| La sesión de la web vive solo en memoria y se pierde al recargar | `apps/web/src/lib/sesion.tsx:8` | [Consta] auditoría H18 (`auditoria-documentacion.md:55`); `e2e/registro-tendero.spec.ts:6` |
| La web envía el id de la sesión | `apps/web/src/lib/api.ts:49` (lista), `apps/web/src/pages/RegistrarTendero.tsx:39` (registro) | [Consta] `HU-101-plan.md:153` («`vendedorId` se toma de `useSesion()`»); `docs/modulos/tenderos.md:127-128` |
| La API no recibe nada que pruebe que el id es de quien llama | `tenderos.ts:23-26` y `:52`: solo comprueban que el id exista | [Consta] `HU-101-pr.md:221` («la API no comprueba quién lo envía»); `HU-102-plan.md:246`; `HU-102-pr.md:125` |

## (4) Alternativas consideradas

**Para la decisión de origen —identificar al vendedor por un id que manda el cliente (`d12301e`)—: No consta que se evaluaran alternativas.**

Para una pieza posterior consta lo siguiente:

| Alternativa | Dónde consta que se evaluó | Por qué no se tomó |
|---|---|---|
| Enviar el `vendedorId` del `PUT` en el cuerpo, no en la consulta | `docs/planes/HU-102-plan.md:122`, en una [Propuesta] del autor del plan | El plan propone la consulta «para no mezclarlo con el cuerpo estricto» (`HU-102-plan.md:122`). El tech lead fijó la consulta con otro motivo, «igual que en la lista de tenderos» (`HU-102-decisiones-del-equipo.md:26`); no consta que él evaluara el cuerpo. Solo cambia por dónde viaja el id, no cómo se identifica al vendedor. |

El ingreso con contraseña no figura como alternativa: en el material solo aparece como fuera del alcance (`HU-101-registro-de-tenderos.md:164`; `docs/historias/HU-102-edicion-de-datos-del-tendero.md:124`) o como la protección que llegará después (`HU-102-decisiones-del-equipo.md:26`; `HU-102-plan.md:246`), sin compararlo con la decisión actual. Está en Riesgo abierto y en Pendientes.

No se cuenta como alternativa la pregunta P7 de HU-101 (`HU-101-registro-de-tenderos.md:192-194`): decide qué vendedor queda **asignado** al tendero, no cómo se **identifica** a quien llama (ver Dudas).

## (5) Consecuencias

**Lo que facilita**

| Consecuencia | Evidencia | Tipo |
|---|---|---|
| Las pruebas de la API obtienen el id con `POST /api/sesion` y lo pasan tal cual, sin preparar credenciales | `apps/api/test/ayuda.ts:13-17` | [Deducido] |
| Lista y edición comparten una sola lectura del vendedor | `tenderos.ts:15-27`; commit `fb10af4` | [Consta] |
| No hay contraseñas que guardar en la base ni en el repositorio | `migrations/001_inicial.sql:2-7` (la tabla `vendedores` no tiene columna de contraseña); `sesion.ts:7` | [Deducido] de la migración; [Consta] el comentario |
| Las historias del sprint se construyeron sin esperar a la autenticación | `HU-101-registro-de-tenderos.md:164`; `HU-102-edicion-de-datos-del-tendero.md:124` | [Consta] que quedó fuera del alcance; que eso facilitó el avance es [Deducido] |

**Lo que cuesta**

| Consecuencia | Evidencia | Tipo |
|---|---|---|
| El control de zona se salta cambiando el id: lista de otra zona, 403 de la edición | `tenderos.ts:23-26`, `:40`, `:113`, `:125-128` | [Consta] `HU-102-pr.md:125`; auditoría H05 (`docs/auditoria-documentacion.md:42`) |
| Cualquier cliente registra tenderos a nombre y en la zona de otro vendedor | `tenderos.ts:52`, `:73-74` | [Consta] `docs/planes/HU-101-pr.md:221` (cita `tenderos.ts:42`, la línea de entonces; hoy es `:52`) |
| El id viaja por dos canales (consulta y cuerpo) y la web tiene que recordar cuál usa cada endpoint; hoy guardar la edición falla porque `actualizarTendero` no lo envía | `api.ts:54-55` frente a `tenderos.ts:113-116` | [Consta] `HU-102-pr.md:124`; `HU-102-plan.md:262` (riesgo 16); `docs/modulos/tenderos.md:317` (PC-01) |
| Un vendedor inexistente responde distinto según el endpoint: 404 en la lista y el registro, 400 en la edición | `tenderos.ts:37`, `:54`, `:112-116` | [Consta] la regla del `PUT` en `HU-102-decisiones-del-equipo.md:26`; la diferencia entre endpoints es [Deducido] |
| La sesión se pierde al recargar la página y el vendedor tiene que volver a ingresar | `sesion.tsx:8`; `App.tsx:26-29` | [Consta] `e2e/registro-tendero.spec.ts:6`; auditoría H18 (`auditoria-documentacion.md:55`) |

## (6) Riesgo abierto

**El control de zona no protege frente a quien cambie el `vendedorId`.** [Deducido del código] La API solo comprueba que el id exista (`tenderos.ts:24-26`, `:52-55`) y toma la zona de ese vendedor (`tenderos.ts:26`, `:73`); no hay nada que ate el id a la persona que llama. Con eso, un cliente puede leer la lista de otra zona (`tenderos.ts:40`), registrar en otra zona (`tenderos.ts:73-74`) y editar tenderos de otra zona (`tenderos.ts:125`).

**Dónde ya está registrado:** `HU-101-pr.md:221`, `HU-102-plan.md:246`, `HU-102-decisiones-del-equipo.md:26`, `HU-102-pr.md:125`, auditoría H05 (`auditoria-documentacion.md:42`) y PC-03 (`docs/modulos/tenderos.md:319`). **No** está en `docs/contexto-del-portal.md`, que es lo que lee quien llega nuevo (auditoría H05).

**Qué lo haría innecesario:** según el material, «el ingreso con contraseña» (`HU-102-decisiones-del-equipo.md:26`; `HU-102-pr.md:125`). El material no dice cómo se implementaría ni cuándo; eso va a Pendientes.

## (7) Pendientes

| Qué hay que decidir | Por qué | Quién |
|---|---|---|
| En qué sprint entra el ingreso con contraseña | Está fuera del alcance de HU-101 y HU-102, y no aparece en el backlog (`docs/historias/backlog-sprint-1.md:5-12`) | Product owner, con el delivery manager |
| Cómo se implementa ese ingreso y cómo deja de llegar el `vendedorId` desde el cliente | El material nombra la solución, pero no su diseño. Una opción que propone este registro (no considerada en el material) es que la API derive el vendedor de la sesión en lugar de recibirlo en cada petición | Tech lead o arquitecto, en un ADR nuevo que supere a este |
| Si `GET /api/tenderos/:id` debe exigir el vendedor y comprobar la zona | Hoy no pide vendedor (`tenderos.ts:90-102`); está abierto como PC-08 (`docs/modulos/tenderos.md:324`, `:341`) | Tech lead y product owner |
| Si HU-103 y HU-104 se construyen sobre este mismo esquema | HU-103 «usa el endpoint actual de tenderos» (`backlog-sprint-1.md:60`) y HU-104 usa `GET /api/tenderos/:id` (`backlog-sprint-1.md:73`); la auditoría avisa que se puede construir encima creyendo que el control de zona protege (`auditoria-documentacion.md:42`) | Tech lead |
| Si se unifica el canal del id (consulta o cuerpo) y la respuesta ante un vendedor inexistente (400 o 404) | Ver «Lo que cuesta» | Tech lead |
| Agregar la limitación a «Limitaciones conocidas» del contexto | Acción 4 de la auditoría (`auditoria-documentacion.md:79`) | Autor del contexto |

## Dudas

| Duda | Por qué no se resuelve leyendo el repositorio | A quién preguntar |
|---|---|---|
| ¿Quién decidió identificar al vendedor por el id del cliente en el código inicial, y cuándo? | `d12301e` trae el código sin ningún documento; el autor del commit no es necesariamente quien decidió | Tech lead o delivery manager |
| ¿Fue una decisión consciente para el sprint 1 o el efecto de partir de un código de práctica? | `sesion.ts:7` dice «repositorio de práctica» y `contexto-del-portal.md:20` dice «en este sprint»; ninguno dice si fue elegido | Tech lead |
| ¿En qué fecha se aprobó la fila «Identidad del vendedor»? | `HU-102-decisiones-del-equipo.md:26` no tiene fecha; D12 y D13 sí (`:34-35`) | Tech lead |
| La propuesta de P7 dice «si `vendedorId` lo fija el servidor desde la sesión» (`HU-101-registro-de-tenderos.md:194`): ¿alguien pensó en una sesión del lado del servidor? | La respuesta del product owner (`HU-101-respuestas-del-product-owner.md:13`) solo elige la opción (a) y no habla de cómo llega el id | Product owner y tech lead |
| ¿El portal llegará a un ambiente con datos reales antes de que exista el ingreso con contraseña? | El material no habla de ambientes ni de fechas de salida; de eso depende cuánto pesa el riesgo abierto | Delivery manager |
| ¿Quién revisa y aprueba los ADR de este repositorio? | No hay ninguna regla sobre ADR en `CLAUDE.md` ni en la plantilla de PR; de eso depende que este registro pase de propuesto a aceptado | Tech lead |
