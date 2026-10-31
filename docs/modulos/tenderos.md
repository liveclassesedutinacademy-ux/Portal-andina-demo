# Módulo de tenderos · Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos que aparecen aquí son inventados (salen de `test-data/`).

Documento derivado del código en `main` (commit `6913486`), revisado el 30 de octubre de 2026, y actualizado con HU-103 (búsqueda por nombre de tienda) en la rama `hu-103-busqueda-tenderos`: las citas de `tenderos.ts`, `Tenderos.tsx` y `api.ts` se revisaron contra el código de esa rama. Cada afirmación lleva el archivo y la línea donde se comprueba. Las historias, los planes y las decisiones solo se citan como **origen** de una regla, nunca como prueba de que el código la cumple.

---

## 1. Propósito

El módulo deja que el **vendedor** de Andina vea los tenderos de su zona y registre un tendero nuevo desde el portal; la API también permite editar el nombre, el nombre de la tienda, el teléfono, el correo y la dirección, pero desde el formulario del portal todavía no se puede guardar (`api.ts:54-55`, `tenderos.ts:125-128`).
Valida el documento (DI, RT, PA), el teléfono y el correo en la API, y no permite dos tenderos con el mismo tipo y número de documento.
Cubre la lista de tenderos y su búsqueda por nombre de tienda (HU-103; ver §7), HU-101 (registro: el flujo principal funciona de punta a punta, y varias reglas solo se prueban en la API; ver §7) y HU-102 (edición: hecha en la API y pendiente en la web).

---

## 2. Contexto y contenedores

### 2.1 Diagrama de contexto (C4, nivel 1)

```
        ┌──────────────────────────────┐
        │  Vendedor de Andina          │   [Persona]
        │  (entra con su código,       │   Ingreso simulado, sin contraseña
        │   p. ej. V-101)              │   (apps/api/src/routes/sesion.ts:7)
        └──────────────┬───────────────┘
                       │ consulta la lista de su zona y registra tenderos;
                       │ abre la edición, pero no puede guardarla (navegador)
                       ▼
        ┌──────────────────────────────┐
        │  Portal Andina               │   [Sistema de software]
        │  · módulo de tenderos        │
        └──────────────────────────────┘

  Sistemas externos con los que habla el módulo: ninguno.
  (El código no tiene clientes HTTP salvo fetch('/api/…') de apps/web/src/lib/api.ts:38;
   las dependencias de la API son solo express y zod: apps/api/package.json:12-15.)
```

Una persona, el vendedor, usa el módulo, y en el código el módulo no se conecta con ningún sistema fuera del portal.

### 2.2 Diagrama de contenedores (C4, nivel 2)

```
  Vendedor
     │ HTTP (navegador)
     ▼
┌───────────────────────────────────────────┐
│ apps/web · SPA React 19 + React Router    │  [Contenedor: aplicación web]
│ Vite, puerto 5173 (vite.config.ts:8)      │
│ Pantallas: Tenderos, RegistrarTendero,    │
│ EditarTendero (App.tsx:39-41)             │
│ Sesión en memoria de React (sesion.tsx:8) │
└───────────────┬───────────────────────────┘
                │ JSON sobre HTTP, /api/* 
                │ (proxy de Vite en desarrollo: vite.config.ts:9)
                ▼
┌───────────────────────────────────────────┐
│ apps/api · Node.js + Express 5 + zod      │  [Contenedor: API]
│ puerto 3001 o PORT (server.ts:9)          │
│ Rutas /api/tenderos (app.ts:17)           │
│ Validación: validaciones/tendero.ts,      │
│             validaciones/documento.ts     │
└───────────────┬───────────────────────────┘
                │ node:sqlite, consultas con parámetros (db.ts:1, 14)
                ▼
┌───────────────────────────────────────────┐
│ SQLite                                    │  [Contenedor: base de datos]
│ apps/api/data/portal.db o PORTAL_DB       │
│ (server.ts:8); ':memory:' en pruebas      │
│ (test/ayuda.ts:8) y en e2e                │
│ (playwright.config.ts:19)                 │
│ Tablas vendedores y tenderos              │
│ (migrations/001_inicial.sql:2-30) e índice│
│ único (migrations/002_…sql:2)             │
└───────────────────────────────────────────┘
        ▲
        │ carga inicial si la tabla vendedores está vacía (server.ts:12-13)
┌───────┴───────────────────────────────────┐
│ test-data/*.json (generados por           │  [Archivos de datos sintéticos]
│ test-data/generar.mjs) · seed.ts:7, 14-32 │
└───────────────────────────────────────────┘
```

La web corre en el navegador y llama a la API por `/api`. La API valida, aplica las reglas y guarda en un archivo SQLite, que se carga con los datos sintéticos de `test-data/` la primera vez que arranca.

---

## 3. Interfaces

### 3.1 Endpoints (`apps/api/src/routes/tenderos.ts`, montado en `/api/tenderos` en `app.ts:17`)

Forma de un tendero en las respuestas (`tenderos.ts:6-7`): `{ id, tipoDocumento, numeroDocumento, nombre, nombreTienda, telefono, correo, direccion, zona, vendedorId, estado }`. La columna `creado_en` (`001_inicial.sql:29`) no se devuelve.

| Método | Ruta | Entrada | Salida | Errores (código · mensaje exacto · dónde se comprueba) |
|---|---|---|---|---|
| GET | `/api/tenderos` | Consulta `?vendedorId=` (entero > 0) (`tenderos.ts:24-25`) y `?buscar=` opcional (texto, HU-103) (`tenderos.ts:43`; `validaciones/busqueda.ts:19-25`) | 200 `{ tenderos: Tendero[] }` de la zona del vendedor, ordenados por `nombre_tienda`; incluye activos e inactivos (`tenderos.ts:48-52`). Con `buscar` de 3 o más caracteres (sin los espacios de los extremos), solo los que tienen el texto en el nombre de la tienda, sin distinguir mayúsculas ni marcas diacríticas (R27 a R29); si ninguno coincide, `{ tenderos: [] }` | 400 · `Falta el vendedor` (sin punto) si falta o no es entero positivo (`tenderos.ts:39`; prueba del mensaje con `vendedorId=abc` en `tenderos.test.ts:20-23`; sin `vendedorId`, `tenderos.test.ts:14-18` solo comprueba el código 400) · 404 · `Vendedor no encontrado` (sin punto) (`tenderos.ts:40`; `tenderos.test.ts:24-25`) · 400 · `Revisa los datos del tendero.` si `buscar` llega repetido (`tenderos.ts:43-47`; `busqueda-tenderos.test.ts:103-108`). El vendedor se comprueba antes que `buscar` (`busqueda-tenderos.test.ts:110-116`) |
| POST | `/api/tenderos` | Cuerpo JSON `{ vendedorId, tipoDocumento, numeroDocumento, nombre, nombreTienda, telefono, correo?, direccion }` (`validaciones/tendero.ts:65-79`). Las claves extra se descartan (`z.object`, `tendero.ts:66`); `zona` y `estado` del cuerpo se ignoran | 201 `{ tendero }` con la zona del vendedor, `vendedorId` del cuerpo, `estado: 'activo'` y el documento normalizado (`tenderos.ts:72-99`) | 400 · uno de los mensajes de validación de la tabla 3.2, el del primer campo que falla (`tenderos.ts:59-61`) · 400 · `Revisa los datos del tendero.` si el JSON está mal formado (`app.ts:19-22`; `registro-tendero.test.ts:299-306`) · 404 · `Vendedor no encontrado.` (con punto) (`tenderos.ts:65-67`; `registro-tendero.test.ts:290-297`) · 409 · `Este tendero ya está registrado.` (`tenderos.ts:9, 95`; `registro-tendero.test.ts:154-211`) · 409 · `Este tendero ya está registrado y está inactivo. Comunícate con la oficina comercial.` solo si el existente está inactivo **y** es de la zona del vendedor (`tenderos.ts:10, 94-95`; `registro-tendero.test.ts:172-188`) · 500 · `Error interno` ante cualquier otra excepción (`app.ts:29-32`) |
| GET | `/api/tenderos/:id` | `:id` entero > 0 (`tenderos.ts:103-104`). No pide vendedor ni comprueba la zona (`tenderos.ts:102-114`) | 200 `{ tendero }` (`tenderos.ts:113`) | 400 · `Identificador inválido` (`tenderos.ts:105`; **sin prueba**) · 404 · `Tendero no encontrado` (`tenderos.ts:110`; `tenderos.test.ts:37-41`, que solo comprueba el código) |
| PUT | `/api/tenderos/:id` | `:id` entero > 0; consulta `?vendedorId=`; cuerpo JSON con **exactamente** los 5 campos `{ nombre, nombreTienda, telefono, correo, direccion }`; `correo` debe venir aunque sea `""` o `null` (`tendero.ts:109-125`) | 200 `{ tendero }` actualizado (`tenderos.ts:151-160`). Solo cambian esos 5 campos (`tenderos.ts:151`) | En este orden (código: `tenderos.ts:119-149`; la prueba `tenderos.test.ts:276-280` solo comprueba los dos primeros pasos): 400 · `El id del tendero debe ser un número.` (`:121`; `tenderos.test.ts:155-160`) → 400 · `Falta el vendedor.` si falta, no es número **o no existe** (`:125-128`; `tenderos.test.ts:263-274`) → 404 · `No encontramos este tendero.` (`:134`; `tenderos.test.ts:148-153`) → 403 · `Este tendero no es de tu zona.` (`:138`; `tenderos.test.ts:224-243, 255-261`) → 409 · `Este tendero está inactivo y no se puede editar.` (`:142`; `tenderos.test.ts:245-253`) → 400 · mensaje de validación de la tabla 3.2 (`:145-148`). JSON mal formado: 400 · `Revisa los datos del tendero.` (`app.ts:19-22`; `tenderos.test.ts:217-222`). 500 · `Error interno` (`app.ts:29-32`) |

### 3.2 Mensajes de validación del cuerpo

| Mensaje exacto | Cuándo | POST | PUT | Código |
|---|---|---|---|---|
| `Falta el vendedor.` | `vendedorId` ausente, no entero o ≤ 0 | Sí | No (en el PUT el vendedor va en la consulta) | `tendero.ts:7, 68` |
| `Elige el tipo de documento: DI, RT o PA.` | Tipo ausente o distinto de `DI`, `RT`, `PA` (también en minúsculas) | Sí | No | `tendero.ts:8, 69` |
| `El documento de identidad debe tener de 6 a 10 dígitos.` | DI inválido | Sí | No | `documento.ts:8, 14` |
| `El registro tributario no es válido.` | RT con formato o dígito de control inválido | Sí | No | `documento.ts:9, 15, 46-49` |
| `El pasaporte debe tener de 6 a 9 letras mayúsculas o dígitos.` | PA inválido | Sí | No | `documento.ts:10, 16` |
| `El nombre del tendero es obligatorio.` | Nombre ausente, nulo, vacío o solo espacios | Sí | Sí | `tendero.ts:9, 42-43` |
| `El nombre de la tienda es obligatorio.` | Ídem para nombre de la tienda | Sí | Sí | `tendero.ts:10` |
| `El teléfono es obligatorio.` | Teléfono ausente, nulo, vacío o solo espacios | Sí | Sí | `tendero.ts:11, 50-52` |
| `El teléfono solo puede tener números.` | Teléfono con algo distinto de dígitos, espacios o guiones | No (el POST responde el mensaje de longitud) | Sí | `tendero.ts:100, 103-107` |
| `El teléfono debe tener de 7 a 10 dígitos.` | Sin espacios ni guiones no quedan de 7 a 10 dígitos | Sí | Sí | `tendero.ts:12, 54` |
| `El correo no es válido.` | Correo escrito que no cumple `^[^\s@]+@[^\s@]+\.[^\s@]+$`, o que no es texto | Sí | Sí | `tendero.ts:13, 32, 58, 61` |
| `La dirección es obligatoria.` | Dirección ausente, nula, vacía o solo espacios | Sí | Sí | `tendero.ts:14` |
| `Cada campo admite máximo 100 caracteres.` | Un texto de más de 100 caracteres. Se mide después de quitar los espacios de los extremos: así se deduce del orden de `tendero.ts:43` (`.trim()` antes de `.max()`); ninguna prueba lo usa con espacios | Sí | Sí | `tendero.ts:15, 31, 43, 53, 60` |
| `Revisa los datos del tendero.` | Número de documento vacío o que no es texto; nombre, nombre de la tienda, teléfono o dirección con un tipo que no es texto (un correo que no es texto da `El correo no es válido.`, y un tipo de documento que no es texto da el mensaje del tipo); cuerpo que no es objeto; en el PUT, cualquier campo no editable o `correo` ausente | Sí | Sí | `tendero.ts:22, 38-39, 78, 85-86, 110, 116-125` |

Si fallan varios campos se devuelve el primero en el orden `vendedorId, tipoDocumento, numeroDocumento, nombre, nombreTienda, telefono, correo, direccion` (`tendero.ts:35, 128-132`; prueba `validacion-tendero.test.ts:135-139`). En el PUT, un campo no editable da un error sin campo, que queda primero (`tendero.ts:129-130`; prueba `tenderos.test.ts:162-170`: un cuerpo con solo `zona` y `estado` responde el mensaje general y no el de nombre obligatorio).

### 3.3 Pantallas (`apps/web/src/App.tsx:39-41`; todas exigen sesión, `App.tsx:26-29`)

| Ruta de la web | Componente | Qué hace | Endpoint que llama |
|---|---|---|---|
| `/tenderos` | `Tenderos` (`pages/Tenderos.tsx`) | Muestra «Tenderos de la zona X», la tabla Tienda / Tendero / Documento / Teléfono con un enlace «Editar» por fila, el enlace «Registrar tendero» y el mensaje que llega en `location.state` (`Tenderos.tsx:17, 43-62`). Si la carga falla, muestra el mensaje de la API (`Tenderos.tsx:34`). Tiene el campo «Buscar tienda» (`Tenderos.tsx:47-48`): con 3 o más caracteres sin los espacios de los extremos vuelve a pedir la lista con ese texto y muestra solo lo que responde la API (`:19, 26-31`); si no hay ninguna, muestra «No hay tiendas con ese nombre en tu zona» (`:63`). Con menos, pide y muestra la lista completa (R31) | `GET /api/tenderos?vendedorId=<id de la sesión>`, con `&buscar=<texto>` si hay búsqueda (`Tenderos.tsx:26-27`, `api.ts:49`) |
| `/tenderos/nuevo` | `RegistrarTendero` (`pages/RegistrarTendero.tsx`) | Formulario con tipo (DI por defecto, `RegistrarTendero.tsx:9`), número, nombre, tienda, teléfono, correo y dirección. Solo valida en el navegador con `required` (el tipo y todos los campos menos el correo) y `maxLength=100` (los 6 campos de texto; el selector del tipo no lo tiene) (`RegistrarTendero.tsx:52-74`). Al guardar con éxito vuelve a `/tenderos` con «Tendero registrado» (`:40`); si falla, muestra el mensaje de la API en `role="alert"` y conserva lo escrito (`:41-44, 76`) | `POST /api/tenderos` con el `vendedorId` de la sesión en el cuerpo (`RegistrarTendero.tsx:39`, `api.ts:51-52`) |
| `/tenderos/:id/editar` | `EditarTendero` (`pages/EditarTendero.tsx`) | Carga los 5 campos editables del tendero (`:17-27`). Los campos no tienen `required` ni `maxLength` (`:47-56`). Al guardar muestra «Datos guardados» o «No se pudo guardar: <mensaje>» en `role="status"` en la misma pantalla (`:32-41, 58`); no vuelve a la lista | `GET /api/tenderos/:id` (`:18`, `api.ts:50`) y `PUT /api/tenderos/:id` **sin** `?vendedorId=` (`:36`, `api.ts:54-55`), que la API responde con 400 `Falta el vendedor.` (`tenderos.ts:125-128`). Ver pendiente PC-01 |

---

## 4. Reglas de negocio

| # | Regla (lo que hace el código) | Dónde se aplica | Dónde se decidió |
|---|---|---|---|
| R1 | La lista muestra solo los tenderos de la zona del vendedor. La consulta de un tendero por id no comprueba la zona (PC-08) | `tenderos.ts:48-52`; sin control de zona en `tenderos.ts:102-114` | `docs/contexto-del-portal.md:79` (regla 1) |
| R2 | Un tendero se identifica por tipo y número de documento: no se repite el par; el mismo número con otro tipo sí se admite | `migrations/002_tenderos_documento_unico.sql:2`; `tenderos.ts:88-89` | `docs/reglas-documento-tendero.md:32`; HU-101 CA13 y CA14 (`docs/historias/HU-101-registro-de-tenderos.md:69, 74`) |
| R3 | El índice único es la única comprobación de duplicados; no hay consulta previa, también ante un doble envío | `tenderos.ts:69-97` | HU-101 CA17 (`HU-101-registro-de-tenderos.md:89-92`) solo fija el resultado: dos envíos dejan un solo tendero, uno con 201 y otro con 409. Que no haya consulta previa lo explica un comentario del código (`tenderos.ts:69`); no hay una decisión escrita sobre eso |
| R4 | El tendero nuevo queda con la zona del vendedor que lo registra, ese vendedor asignado y estado `activo`; `zona` y `estado` del cuerpo se ignoran | `tenderos.ts:64, 75, 85-86`; `tendero.ts:65-79` | HU-101 P6 a y P7 a (`docs/historias/HU-101-respuestas-del-product-owner.md:12-13`); PT2 (`docs/planes/HU-101-decisiones-del-equipo.md:10`) |
| R5 | Se valida el cuerpo antes de buscar el vendedor (400 antes que 404) | `tenderos.ts:58-68` | PT4 (`HU-101-decisiones-del-equipo.md:12`) |
| R6 | Formatos: DI 6 a 10 dígitos; RT `NNNNNNNNN-D`; PA 6 a 9 de A–Z y dígitos | `documento.ts:13-17` | `docs/reglas-documento-tendero.md:9-11` |
| R7 | Dígito de control del RT: pesos 2 a 10 desde la derecha, residuo de 11; si es 10, el dígito es 0 | `documento.ts:30-39, 46-49` | `docs/reglas-documento-tendero.md:13-19` |
| R8 | Antes de validar se quitan espacios y puntos del número; en PA, las letras a–z pasan a mayúsculas (solo a–z). Se guarda normalizado | `documento.ts:25-28`; `tendero.ts:95` | `reglas-documento-tendero.md:33`; HU-101 P11 b (`HU-101-respuestas-del-product-owner.md:17`); D9 (`HU-101-decisiones-del-equipo.md:28`) |
| R9 | Un RT sin guion se rechaza | `documento.ts:15` | HU-101 P11 b (`HU-101-respuestas-del-product-owner.md:17`) |
| R10 | Los documentos que empiezan por `999` se aceptan (no hay ninguna regla que los rechace) | `documento.ts:13-17` (no hay otra comprobación) | HU-101 P8 b (`HU-101-respuestas-del-product-owner.md:14`) |
| R11 | Todos los campos son obligatorios menos el correo. Nombre, nombre de la tienda, teléfono, correo y dirección admiten máximo 100 caracteres; el número de documento no tiene ese límite y su longitud la limita el formato de cada tipo (R6) | `tendero.ts:31, 41-43, 49-54, 57-63, 71`; `documento.ts:13-17` | HU-101 P1 b (`HU-101-respuestas-del-product-owner.md:7`); HU-102 P5 (`HU-102-respuestas-del-product-owner.md:11`) |
| R12 | Los textos se guardan sin los espacios de los extremos; un texto con solo espacios cuenta como vacío | `tendero.ts:43, 51, 59` | D2 y PT3 (`HU-101-decisiones-del-equipo.md:11, 21`); HU-102 P5 |
| R13 | Teléfono: sin espacios ni guiones deben quedar de 7 a 10 dígitos; se guarda como se escribió (recortado) | `tendero.ts:45-54` | HU-101 P2 (`HU-101-respuestas-del-product-owner.md:8`); HU-102 P3 (`HU-102-respuestas-del-product-owner.md:9`); decisión «Teléfono tal como lo escribió» (`docs/planes/HU-102-decisiones-del-equipo.md:18`) |
| R14 | El teléfono es obligatorio también en la edición, aunque la columna admite nulo (`001_inicial.sql:23`) | `tendero.ts:103-107` | HU-102 P4 b (`HU-102-respuestas-del-product-owner.md:10`). Ver PC-09 |
| R15 | En la edición, un teléfono con letras tiene su propio mensaje | `tendero.ts:100-107` | D12 (`HU-102-decisiones-del-equipo.md:34`) |
| R16 | Correo opcional; si se escribe, `texto@dominio.algo` sin espacios y con una sola arroba; vacío o solo espacios se guarda nulo; no se pasa a minúsculas. La regla es una expresión propia (`FORMATO_CORREO`), no la validación de correo de zod | `tendero.ts:32, 56-63` | HU-101 P3 a y D4 (`HU-101-respuestas-del-product-owner.md:9`; `HU-101-decisiones-del-equipo.md:23`); HU-102 P4 b, P5 y P9 a (`HU-102-respuestas-del-product-owner.md:10-11, 15`). La opción a) de P9 en la historia proponía la validación de correo de zod (`HU-102-edicion-de-datos-del-tendero.md:177`); ver Dudas |
| R17 | Si fallan varios campos, se responde el primero en el orden del formulario | `tendero.ts:35, 128-132` | D3 (`HU-101-decisiones-del-equipo.md:22`) |
| R18 | Lo que no tiene mensaje aprobado responde `Revisa los datos del tendero.` (incluido JSON mal formado en `/api/tenderos`) | `tendero.ts:22, 38-39`; `app.ts:19-22` | D10 (`HU-101-decisiones-del-equipo.md:29`); D13 (`HU-102-decisiones-del-equipo.md:35`) |
| R19 | Duplicado: mensaje general; el mensaje de inactivo solo si el existente es de la zona del vendedor (no se revela nada de otra zona) | `tenderos.ts:90-95` | HU-101 P4 a y P5 c (`HU-101-respuestas-del-product-owner.md:10-11`); D5 (`HU-101-decisiones-del-equipo.md:24`) |
| R20 | Solo se editan nombre, nombre de la tienda, teléfono, correo y dirección; cualquier otro campo en el cuerpo responde 400 y no cambia nada | `tendero.ts:116-125`; `tenderos.ts:151` | HU-102 P1 c y P2 (`HU-102-respuestas-del-product-owner.md:7-8`); decisión «Documento en el cuerpo» (`HU-102-decisiones-del-equipo.md:20`) |
| R21 | El PUT exige los 5 campos (no hay edición parcial); `correo` tiene que venir | `tendero.ts:109-110, 116-125` | Decisión «Cuerpo de la petición» (`HU-102-decisiones-del-equipo.md:19`); D13 |
| R22 | No se edita un tendero de otra zona (403) ni uno inactivo (409); un inactivo de otra zona da 403 | `tenderos.ts:137-144` | HU-102 P10 a y P6 b (`HU-102-respuestas-del-product-owner.md:12, 16`); decisión «Orden de las comprobaciones» (`HU-102-decisiones-del-equipo.md:27`) |
| R23 | En el PUT el vendedor llega en `?vendedorId=`; si falta, no es número o no existe → 400 | `tenderos.ts:20-28, 124-129` | Decisión «Identidad del vendedor» (`HU-102-decisiones-del-equipo.md:26`) |
| R24 | El formulario de registro solo valida obligatorios y longitud; el resto lo valida la API y el formulario muestra su mensaje | `RegistrarTendero.tsx:20-24, 52-76` | PT6 (`HU-101-decisiones-del-equipo.md:14`) |
| R25 | Tras registrar, se vuelve a la lista con «Tendero registrado» | `RegistrarTendero.tsx:40`; `Tenderos.tsx:17, 44` | HU-101 P9 a (`HU-101-respuestas-del-product-owner.md:15`) |
| R26 | Ningún endpoint cambia el estado de un tendero: el registro siempre crea `activo` y el PUT no toca `estado` | `tenderos.ts:75, 151` | HU-101 P6 a (`HU-101-respuestas-del-product-owner.md:12`) para el estado inicial; HU-102 P1 (`HU-102-respuestas-del-product-owner.md:7`) para que el estado no se edite |
| R27 | La búsqueda filtra en la API, dentro de la consulta por zona: solo recorre los tenderos de la zona del vendedor, activos e inactivos (como la lista, PC-14) | `tenderos.ts:48-52` | HU-103 CA5 (`docs/historias/backlog-sprint-1.md:56`). Que el filtro vaya en la API es la propuesta P1, **pendiente de aprobación** (`docs/planes/HU-103-decisiones-propuestas.md:9`) |
| R28 | Coincide si el nombre de la tienda contiene el texto, comparando los dos en minúsculas y sin marcas diacríticas: tildes, diéresis y también la de la ñ («dona» encuentra «Doña») | `validaciones/busqueda.ts:10-12`; función de SQLite `comparable` registrada en `tenderos.ts:33` y usada en `:50` | HU-103 CA2 (`backlog-sprint-1.md:53`). Que la ñ cuente como n es la propuesta P2, **pendiente de aprobación** (`HU-103-decisiones-propuestas.md:10`) |
| R29 | El texto se cuenta sin los espacios de los extremos; con menos de 3 caracteres (o solo espacios) se devuelve la lista completa, sin error | `validaciones/busqueda.ts:19-25`; `tenderos.ts:48` | HU-103 CA3 (`backlog-sprint-1.md:54`). Qué cuenta como carácter es la propuesta P3, **pendiente de aprobación** (`HU-103-decisiones-propuestas.md:11`) |
| R30 | Un `buscar` que no es texto (parámetro repetido) responde 400 con el mensaje general; no hay límite de longitud | `validaciones/busqueda.ts:20`; `tenderos.ts:43-47` | D10 (`HU-101-decisiones-del-equipo.md:29`) aplicada por la propuesta P4, **pendiente de aprobación** (`HU-103-decisiones-propuestas.md:12`) |
| R31 | La web no filtra: envía el texto (sin los espacios de los extremos) solo cuando tiene 3 o más caracteres, vuelve a pedir la lista en cada cambio de ese texto, sin espera, y descarta la respuesta de un texto que ya cambió. El mensaje «No hay tiendas con ese nombre en tu zona» solo sale con una búsqueda activa sin resultados | `Tenderos.tsx:7, 19, 21-39, 63` | HU-103 CA3 y CA4 (`backlog-sprint-1.md:54-55`). Cuándo llama a la API es la propuesta P5, **pendiente de aprobación** (`HU-103-decisiones-propuestas.md:13`) |

---

## 5. Dependencias

### Dentro del repositorio

| De qué depende | Para qué | Dónde |
|---|---|---|
| Sesión simulada (`POST /api/sesion`, pantalla de ingreso y contexto de React) | La web toma el `vendedorId` y la zona de la sesión. La sesión vive solo en memoria y se pierde al recargar | `apps/api/src/routes/sesion.ts:8-25`; `apps/web/src/pages/Ingreso.tsx:16-18`; `apps/web/src/lib/sesion.tsx:7-12`; `App.tsx:26-29`; `e2e/registro-tendero.spec.ts:6` |
| Tabla `vendedores` | Da la zona del vendedor; `tenderos.vendedor_id` es clave foránea con `PRAGMA foreign_keys = ON` | `001_inicial.sql:2-7, 27`; `db.ts:15`; `tenderos.ts:26, 64` |
| Migraciones y su aplicación | Se aplican en orden de nombre y se registran en la tabla `migraciones` | `apps/api/src/db.ts:16-24`; `migrations/001_inicial.sql`; `migrations/002_tenderos_documento_unico.sql` |
| Datos sintéticos | Base de la API local, de las pruebas y del e2e | `apps/api/src/seed.ts:14-32`; `server.ts:12-13`; `test/ayuda.ts:7-11`; `test-data/generar.mjs` |
| Manejadores generales de la API | JSON mal formado (solo en `/api/tenderos`), 404 `Ruta no encontrada`, 500 `Error interno` | `apps/api/src/app.ts:19-32` |
| Cliente HTTP de la web | Todas las llamadas; el mensaje de error que muestra la web es el campo `error` de la API o `Error de comunicación con el servidor` | `apps/web/src/lib/api.ts:37-42` |
| Variables de entorno (solo nombres, leídos en el código) | `PORTAL_DB` (ruta de la base) y `PORT` (puerto de la API) | `apps/api/src/server.ts:8-9`; `apps/api/src/scripts/reset-db.ts:8`; `playwright.config.ts:19` |

### Fuera del repositorio

| Dependencia | Versión declarada | Dónde |
|---|---|---|
| Node.js con `node:sqlite` | `>=22.13` | `package.json:6`; `db.ts:1` |
| express | `^5.1.0` | `apps/api/package.json:13` |
| zod | `^4.1.0` | `apps/api/package.json:14` |
| react / react-dom | `^19.1.0` | `apps/web/package.json:12-13` |
| react-router-dom | `^7.9.0` | `apps/web/package.json:14` |
| vite | `^7.1.0` | `apps/web/package.json:25` |
| Pruebas: vitest, supertest, @testing-library/*, jsdom, @playwright/test (Chromium) | `^5.0.2`, `^7.1.0`, varias, `^26.1.0`, `1.56.0` | `apps/api/package.json:20, 23`; `apps/web/package.json:17-19, 23, 26`; `package.json:15`; `playwright.config.ts:14` |

No hay servicios externos en tiempo de ejecución (ver §2.1).

---

## 6. Cómo se prueba

### Comandos

| Comando | Qué ejecuta | Configuración |
|---|---|---|
| `npm test` | Vitest de la API (Supertest, base `:memory:`) y luego Vitest de la web (jsdom) | `package.json:9`; `apps/api/vitest.config.ts:6` solo recoge `test/**/*.test.ts`; `apps/web/vite.config.ts:15` solo recoge `test/**/*.test.tsx` |
| `npm run lint` | `tsc --noEmit` en las dos aplicaciones | `package.json:11` |
| `npm run test:e2e` | Playwright en Chromium; levanta la API con `PORTAL_DB=:memory:` y la web, **o reutiliza** servidores ya levantados en 3001 y 5173 si no hay `CI` | `playwright.config.ts:15-29` |
| `npm test -w apps/api -- <archivo>` | Un solo archivo de pruebas de la API | `apps/api/package.json:8` |

Ayudas de prueba de la API: `appDePrueba()` (base en memoria con `test-data/`), `idVendedor()` (id por código vía `POST /api/sesion`) y `datosBase()` (`apps/api/test/ayuda.ts:7-29`). Los tenderos inactivos se crean dentro de cada prueba con `INSERT` parametrizado (`tenderos.test.ts:56-65`; `registro-tendero.test.ts:147-152`).

### Archivos de prueba que cubren el módulo

| Archivo | Tipo | Pruebas en la corrida | Qué cubre |
|---|---|---|---|
| `apps/api/test/documento.test.ts` | Unitaria | 43 | DI, RT (dígito de control), PA, normalización y que todos los documentos de `test-data/` pasan el validador |
| `apps/api/test/validacion-tendero.test.ts` | Unitaria | 86 | Esquemas de registro y edición, mensajes y orden de errores |
| `apps/api/test/registro-tendero.test.ts` | Integración (Supertest) | 55 | `POST /api/tenderos`: válidos, normalización, duplicados, doble envío (CA17), errores |
| `apps/api/test/tenderos.test.ts` | Integración (Supertest) | 34 | `GET /api/tenderos`, `GET /api/tenderos/:id`, `PUT /api/tenderos/:id` |
| `apps/api/test/migraciones.test.ts` | Integración (SQLite) | 3 | Migración 002 e índice único |
| `apps/api/test/busqueda-tenderos.test.ts` | Unitaria e integración (Supertest) | 14 | HU-103: `comparable` y `GET /api/tenderos?buscar=` (CA2 a CA5, espacios, comillas y comodines, `buscar` repetido) |
| `apps/web/test/Tenderos.test.tsx` | Componente (fetch simulado) | 4 | Lista, mensaje de `location.state`, error de carga |
| `apps/web/test/BusquedaTenderos.test.tsx` | Componente (fetch simulado) | 10 | HU-103: campo «Buscar tienda», qué envía a la API, lista completa con menos de 3 caracteres, mensaje sin resultados y descarte de respuestas viejas |
| `apps/web/test/RegistrarTendero.test.tsx` | Componente (fetch simulado) | 8 | Envío, mensajes de la API, conservar lo escrito, vuelta a la lista |
| `apps/web/test/EditarTendero.test.tsx` | Componente (fetch simulado) | 3 | Solo la carga de los 5 campos; **no prueba guardar** |
| `e2e/registro-tendero.spec.ts` | Extremo a extremo | 2 | Registro y vuelta a la lista; duplicado con puntos |
| `e2e/navegacion.spec.ts` | Extremo a extremo | 2 (1 del módulo) | Ingreso y apertura de la lista de la zona Norte |
| `e2e/busqueda-tenderos.spec.ts` | Extremo a extremo | 3 | HU-103 con los datos de prueba de la historia: «esq», «ROBLE», «dona», «ésq», «jose», «pinos» para V-101 y V-102; lista completa con 0, 1 y 2 caracteres, sin tiendas de otras zonas |

Fuera del módulo, la corrida incluye `catalogo.test.ts` (2) y `sesion.test.ts` (3). Los conteos por archivo salen de `npx vitest run --reporter=verbose` en `apps/api` y `apps/web`.

### Salida real de la última corrida (30-10-2026, rama `hu-103-busqueda-tenderos`, paso 4 de HU-103: la API, la web y el e2e de la búsqueda; Node v22.23.4)

`npm test`:

```
> test
> npm test -w apps/api && npm test -w apps/web

> test
> vitest run

 RUN  v5.0.2 …/portal-andina/apps/api

 Test Files  8 passed (8)
      Tests  240 passed (240)
   Start at  15:14:42
   Duration  403ms (import 49%, transform 29%, tests 21%, worker 1%)

> test
> vitest run

 RUN  v5.0.2 …/portal-andina/apps/web

 Test Files  4 passed (4)
      Tests  25 passed (25)
   Start at  15:14:42
   Duration  2.47s (tests 45%, environment 37%, import 7%, setup 5%, transform 5%)
```

`npm run lint` (sin errores; `tsc` no imprime nada cuando pasa):

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

  ✓  1 [chromium] › e2e/navegacion.spec.ts:3:5 › el vendedor ingresa, consulta el catálogo y ve los tenderos de su zona (796ms)
  ✓  3 [chromium] › e2e/busqueda-tenderos.spec.ts:31:5 › CA1 a CA3: V-101 busca por nombre de tienda sin distinguir mayúsculas ni tildes (953ms)
  ✓  2 [chromium] › e2e/registro-tendero.spec.ts:28:5 › CA25 y CA2: registra un tendero y vuelve a la lista con «Tendero registrado» (965ms)
  ✓  4 [chromium] › e2e/navegacion.spec.ts:19:5 › un código de vendedor desconocido muestra un error (285ms)
  ✓  5 [chromium] › e2e/busqueda-tenderos.spec.ts:63:5 › CA4 y CA5: «pinos» no devuelve nada para V-101 (es de la zona Sur) y sí para V-102 (571ms)
  ✓  6 [chromium] › e2e/registro-tendero.spec.ts:40:5 › CA22 y CA13: un DI repetido con puntos muestra el mensaje y conserva lo escrito (853ms)
  ✓  7 [chromium] › e2e/busqueda-tenderos.spec.ts:75:5 › CA2: V-102 encuentra «Tienda San José» escribiendo «jose», sin tilde (327ms)

  7 passed (4.0s)
```

Nada falló. Ninguna prueba e2e cubre la edición. No se pudo comprobar si había servidores levantados en 3001 o 5173 durante esta corrida (PC-15; ver Dudas).

---

## 7. Estado por funcionalidad

Criterio: «hecho» solo si una prueba e2e la recorre de punta a punta (web → API → SQLite). Si solo la cubren pruebas de API o de componente, es «parcial».

| Funcionalidad | Estado | Evidencia | Qué falta |
|---|---|---|---|
| Ver la lista de tenderos de la zona | Parcial | e2e `navegacion.spec.ts:14-16` y `registro-tendero.spec.ts:33-37` comprueban que la lista carga y que aparece un tendero recién registrado. El título «Tenderos de la zona Norte» sale de la sesión (`Tenderos.tsx:43`), no de la API. El filtro por zona solo lo prueba la API (`tenderos.test.ts:6-12`; `registro-tendero.test.ts:44-52`) | Un e2e que compruebe que las filas son de la zona del vendedor y que faltan las de otras zonas (la mitad de CA2 que no se prueba de punta a punta: `HU-101-registro-de-tenderos.md:17`) |
| Buscar tiendas por nombre: campo, coincidencia sin mayúsculas ni tildes, lista completa con menos de 3 caracteres, mensaje sin resultados y solo la zona (HU-103 CA1 a CA5) | Hecho | e2e `busqueda-tenderos.spec.ts:31-61` (CA1; CA2 con «esq», «ROBLE», «dona» y «ésq»; CA3 con «es», «e» y vacío, comprobando que están las 5 tiendas del Norte y ninguna de otra zona), `:63-73` (CA4 y CA5 con «pinos» para V-101 y V-102) y `:75-79` (CA2 con «jose»); API `busqueda-tenderos.test.ts:29-85` (las de CA3, `:59-73`, pasarían también sin HU-103, porque la API ya devolvía la lista completa); componente `BusquedaTenderos.test.tsx:56-156` | — Las reglas que aplica (ñ como n, espacios de los extremos) son propuestas pendientes de aprobación (R28, R29). CA5 se comprueba con un ejemplo («pinos»); el límite de PC-03 sigue |
| Búsqueda: espacios de los extremos y texto de solo espacios (P3) | Parcial | API `busqueda-tenderos.test.ts:68-73`; componente `BusquedaTenderos.test.tsx:76-90, 121-130` | Sin e2e |
| Búsqueda: descartar la respuesta de un texto que ya cambió y no mostrar el mensaje sin búsqueda (P5) | Parcial | Componente `BusquedaTenderos.test.tsx:158-186` (respuesta simulada que llega tarde) | Sin e2e: con la API local las respuestas llegan en orden y no se puede provocar el desorden sin simularlo |
| Búsqueda: `buscar` repetido responde 400 (P4) | Parcial | API `busqueda-tenderos.test.ts:103-108` | Sin e2e; la web nunca envía `buscar` repetido |
| Mensaje si la lista no carga | Parcial | `Tenderos.tsx:34`; componente `Tenderos.test.tsx:40-48` (fetch simulado) | Muestra el mensaje de la API, no el texto de D11 (PC-04). Sin e2e |
| Registrar un tendero válido y volver a la lista con «Tendero registrado» | Hecho | e2e `registro-tendero.spec.ts:28-38`; API `registro-tendero.test.ts:36-59`; componente `RegistrarTendero.test.tsx:123-169` | — |
| Rechazar un documento duplicado en la zona (incluido escrito con puntos) y conservar lo escrito | Hecho | e2e `registro-tendero.spec.ts:40-58`; API `registro-tendero.test.ts:154-161, 190-211` | — |
| Duplicado en otra zona y duplicado inactivo (mensaje según zona) | Parcial | API `registro-tendero.test.ts:163-188` | Sin e2e. La app no tiene forma de crear un inactivo (R26); un e2e tendría que prepararlo en la base |
| Doble envío: un solo tendero (CA17) | Parcial | API `registro-tendero.test.ts:215-242`: envía un solo POST y simula el otro envío con un `INSERT` directo justo antes del `INSERT` del POST; comprueba que ese POST responde 409 y que queda un solo tendero. `migraciones.test.ts:25-29` comprueba el índice único | Una prueba con dos POST reales, que compruebe que uno responde 201 y el otro 409, como pide CA17 (`HU-101-registro-de-tenderos.md:91-92`). Sin e2e |
| Validación del documento (DI, RT, PA) y normalización | Parcial | `documento.test.ts` completo; API `registro-tendero.test.ts:61-105, 250-269`; componente `RegistrarTendero.test.tsx:94-101` (respuesta simulada) | Ningún e2e envía un documento inválido ni comprueba lo guardado normalizado (PA en minúsculas, RT con espacios) |
| Validación de nombre, tienda, teléfono, correo, dirección y longitud en el registro | Parcial | `validacion-tendero.test.ts:36-159`; API `registro-tendero.test.ts:271-341`; componente `RegistrarTendero.test.tsx:171-184` | Sin e2e |
| Abrir la edición y cargar los datos del tendero | Parcial | `EditarTendero.tsx:17-27`; componente `EditarTendero.test.tsx:23-49` (fetch simulado); API `tenderos.test.ts:30-35` | Sin e2e. Sin manejo de error si la carga falla (PC-05) |
| Editar y guardar (API `PUT`): validación, 5 campos, 404, 400 | Parcial | API `tenderos.test.ts:73-222, 263-289`; `validacion-tendero.test.ts:183-283` | Sin e2e (paso 7 del plan, `docs/planes/HU-102-plan.md:200`) |
| No editar un tendero de otra zona (403) ni uno inactivo (409) | Parcial | API `tenderos.test.ts:224-261` | Sin e2e. Se puede saltar cambiando `vendedorId` (PC-03) |
| Guardar desde el formulario de edición | Pendiente | `api.ts:54-55` no envía `vendedorId` y `tenderos.ts:125-128` responde 400; ninguna prueba envía el formulario (`EditarTendero.test.tsx` solo prueba la carga) | Enviar `vendedorId` y probarlo (paso 5 del plan, `HU-102-plan.md:162`) (PC-01) |
| Validación en el formulario de edición | Pendiente | `EditarTendero.tsx:47-56` sin `required` ni `maxLength` | Paso 4 del plan (`HU-102-plan.md:145`) (PC-06) |
| Bloquear en el formulario a un tendero inactivo | Pendiente | `EditarTendero.tsx` no lee `estado`; la lista enlaza «Editar» en todas las filas (`Tenderos.tsx:58`) | Paso 5 del plan; decisión «Formulario» (`HU-102-decisiones-del-equipo.md:41`) |
| Volver a la lista con «Datos actualizados» tras editar (CA18) | Pendiente | `EditarTendero.tsx:37` muestra «Datos guardados» y no navega. `Tenderos.test.tsx:50-65` solo prueba que la lista muestra el mensaje si se lo pasan en `location.state` | Navegar a `/tenderos` con ese estado (paso 6, `HU-102-plan.md:192`) y e2e (paso 7) (PC-07) |
| Unicidad del documento en la base | Parcial | `002_tenderos_documento_unico.sql:2`; `migraciones.test.ts:25-35`. El e2e `registro-tendero.spec.ts:40-50` solo cubre el rechazo de un duplicado, que ya está en la fila «Rechazar un documento duplicado» | Un e2e de CA14 (el mismo número con otro tipo se acepta). El e2e del duplicado no comprueba que en la base quede un solo tendero (solo lo comprueba la API, `registro-tendero.test.ts:160`) |

---

## 8. Pendientes conocidos

| Id | Pendiente | Evidencia en el código | Origen |
|---|---|---|---|
| PC-01 | Guardar desde el formulario de edición siempre falla con «No se pudo guardar: Falta el vendedor.» | `api.ts:54-55` (sin `?vendedorId=`); `tenderos.ts:125-128`; `EditarTendero.tsx:39` | `docs/planes/HU-102-pr.md:124`; riesgo 16 de `HU-102-plan.md:262`; auditoría H17 |
| PC-02 | Los comentarios del código dicen que el endpoint de edición no existe, y sí existe | `EditarTendero.tsx:7-11`; `api.ts:53` frente a `tenderos.ts:118-161` | Auditoría H01 (`docs/auditoria-documentacion.md:38`) |
| PC-03 | La API confía en el `vendedorId` que manda el cliente: el control de zona (lista y 403 del PUT) se salta cambiando ese valor | `tenderos.ts:17, 24, 64` | Decisión «Identidad del vendedor» (`HU-102-decisiones-del-equipo.md:26`); auditoría H05 |
| PC-04 | Si la lista no carga, la web muestra el mensaje de la API y no el texto aprobado «No se pudo cargar la lista de tenderos» (ese texto solo se usa si el error no es un `Error`, lo que no ocurre con `llamar`) | `Tenderos.tsx:34`; `api.ts:40` | D11 (`HU-101-decisiones-del-equipo.md:30`); auditoría H16 |
| PC-05 | Si la carga de la edición falla (id inexistente o no numérico), la promesa no tiene `catch`: el formulario queda vacío y no se muestra ningún error | `EditarTendero.tsx:17-27` | Lectura del código para este documento |
| PC-06 | El formulario de edición no valida nada en el cliente | `EditarTendero.tsx:47-56` | Paso 4 de `HU-102-plan.md:145`; auditoría H04 (regla de correo del paso 4) |
| PC-07 | Tras editar no se vuelve a la lista con «Datos actualizados»; se queda en la pantalla con «Datos guardados» | `EditarTendero.tsx:37` | HU-102 P7 (`HU-102-respuestas-del-product-owner.md:13`); paso 6 de `HU-102-plan.md:192` |
| PC-08 | `GET /api/tenderos/:id` devuelve cualquier tendero, de cualquier zona, sin pedir vendedor; la pantalla de edición muestra sus datos a quien escriba la URL | `tenderos.ts:102-114`; `EditarTendero.tsx:18` | Lectura del código para este documento (ver Dudas) |
| PC-09 | La decisión D6 dice que el teléfono es obligatorio «solo para los registros nuevos», pero la edición también lo exige: los tenderos 4, 8 y 12 de `test-data/` (sin teléfono) no se pueden guardar sin completarlo | `tendero.ts:103-107`; `tenderos.test.ts:123-129`; `test-data/generar.mjs:70` | D6 (`HU-101-decisiones-del-equipo.md:25`) frente a HU-102 P4 b; auditoría H09 |
| PC-10 | El POST descarta las claves desconocidas y el PUT las rechaza; nadie decidió si el POST debe rechazarlas | `tendero.ts:66` (`z.object`) frente a `:116` (`z.strictObject`); comentario en `registro-tendero.test.ts:110` | Auditoría H20 |
| PC-11 | Los mensajes de error no son uniformes: `GET` sin punto (`Falta el vendedor`, `Vendedor no encontrado`, `Tendero no encontrado`) y POST/PUT con punto (`Falta el vendedor.`, `Vendedor no encontrado.`, `No encontramos este tendero.`) | `tenderos.ts:39-40, 66, 105, 110, 121, 127, 134` | Auditoría H13; `HU-102-pr.md:127` |
| PC-12 | `400 Identificador inválido` de `GET /api/tenderos/:id` no tiene prueba | `tenderos.ts:104-107`; ninguna prueba en `tenderos.test.ts:29-42` | Lectura del código para este documento |
| PC-13 | La historia HU-102 todavía dice que el documento se edita (CA15, CA19, CA20) y que el correo pasa a minúsculas (CA8); el código hace lo contrario | `tendero.ts:59, 116-125`; `tenderos.test.ts:141-146, 195-206` | Auditoría H02; respuestas P1 c, P2 y P5 de HU-102 |
| PC-14 | La lista muestra también los tenderos inactivos, con enlace «Editar», y editarlos responde 409 | `tenderos.ts:48-52` (sin filtro de estado, tampoco en la búsqueda: `busqueda-tenderos.test.ts:87-94`); `Tenderos.tsx:58`; `tenderos.ts:141-144` | Lectura del código para este documento (ver Dudas) |
| PC-15 | Con `npm run dev` levantado, el e2e reutiliza esos servidores y escribe en la base local; los DI de las pruebas son fijos | `playwright.config.ts:20, 26`; `e2e/registro-tendero.spec.ts:30, 42` | Auditoría H08 |
| PC-16 | Los parámetros de ruta y de consulta se validan con `Number()` y no con zod, a pesar de la convención de `CLAUDE.md` | `tenderos.ts:24-25, 103-104, 119-120`. El parámetro `?buscar=` de HU-103 sí se valida con zod (`tenderos.ts:43`) | Auditoría H14 |
| PC-17 | No hay prueba e2e de la edición | `e2e/` solo tiene `navegacion.spec.ts` y `registro-tendero.spec.ts` | Paso 7 de `HU-102-plan.md:200`; `HU-102-pr.md:71` |

---

## Dudas

| Duda | Por qué no se resuelve leyendo el repositorio | A quién preguntar |
|---|---|---|
| ¿`GET /api/tenderos/:id` debe exigir el vendedor y comprobar la zona, como el PUT? (PC-08) | Ninguna historia ni decisión habla del control de zona en la consulta de un tendero | Tech lead y product owner |
| ¿La lista debe mostrar los tenderos inactivos? Si los muestra, ¿cómo se marcan? (PC-14) | HU-102 P6 b dice que el formulario no deja entrar a un inactivo, pero nada dice si la lista los muestra | Product owner |
| ¿Los pasos 4 a 7 de HU-102 ya están en marcha en otra rama? | Este documento describe solo `main` | Tech lead |
| ¿Se corrige el código para cumplir D11 o se cambia la decisión? (PC-04) | La decisión está aprobada y el código no la cumple; no hay responsable ni fecha | Tech lead |
| ¿El POST debe rechazar las claves desconocidas, como el PUT? (PC-10) | La prueba lo deja expresamente sin decidir (`registro-tendero.test.ts:110`) | Tech lead |
| ¿La regla de correo de la API (`FORMATO_CORREO`, `tendero.ts:32`) acepta los mismos correos que la validación de correo de zod que proponía la opción a) de P9 en la historia? (R16) | La respuesta del product owner describe la regla con palabras y no nombra a zod; comprobarlo exige pasar la misma lista de correos por las dos reglas | Tech lead |
| ¿Había servidores levantados en los puertos 3001 o 5173 durante la corrida e2e de este documento? | No pude comprobarlo: no se aprobó el comando para ver los puertos ocupados. Si los había, Playwright los reutilizó y escribió en la base local en lugar de en memoria (`playwright.config.ts:20, 26`) | La persona que ejecutó la corrida (quien encargó este documento) |
| ¿Las pruebas manuales de HU-101 (`docs/planes/HU-101-pruebas-manuales.md` y `docs/capturas/HU-101/`) siguen valiendo? | No se repitieron para este documento y no cuentan como evidencia automática | QA o tech lead |
| ¿Se aprueban las propuestas P1 a P6 de HU-103 (R27 a R31)? En particular, ¿la ñ cuenta como n al buscar? | La historia no lo dice (`backlog-sprint-1.md:53`); las reglas están implementadas como propuestas (`docs/planes/HU-103-decisiones-propuestas.md`) | Product owner (P2, P3) y tech lead (P1, P4, P5, P6) |
| ¿Quién mantiene este documento cuando cambie el módulo? | No hay ninguna regla sobre documentación por módulo en `CLAUDE.md` ni en la plantilla de PR | Tech lead |
