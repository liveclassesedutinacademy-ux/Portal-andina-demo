# Plan de implementación · HU-101 «Registro de tenderos»

## Contexto

Hoy el vendedor anota en papel los datos de un tendero nuevo y la oficina los carga días después. Mientras tanto no puede tomarle pedidos. HU-101 agrega el registro desde el portal: un endpoint que valida el documento y los datos, fija la zona y el estado, e impide duplicados, y un formulario en la web.

Material: la historia reescrita, las respuestas del PO (P1 a P11), `docs/reglas-documento-tendero.md`, `docs/contexto-del-portal.md`, el CLAUDE.md y el código actual.

**Qué se reutiliza del código actual**
- `apps/api/src/routes/tenderos.ts`: `COLUMNAS` (alias en camelCase) y el patrón de 400/404 de `GET /`.
- `apps/api/src/routes/sesion.ts`: el patrón zod `safeParse` → `{ error }`.
- `apps/api/src/db.ts`: aplica en orden los `.sql` de `migrations/` y los registra en `migraciones`. No hay que tocarlo.
- `apps/api/test/ayuda.ts`: `appDePrueba()`, que crea una base en memoria cargada solo con `test-data/`.
- `apps/web/src/lib/api.ts`: `llamar` y `ErrorApi`, que ya propagan `{ error }` como mensaje.
- `apps/web/src/pages/EditarTendero.tsx` e `Ingreso.tsx`: los patrones de formulario (`label`/`input` con id, `role="alert"`).
- `test-data/generar.mjs`: su `digitoControlRT` sirve de referencia, pero la API no lo importa. Se reimplementa en TypeScript y una prueba comprueba que los RT de `test-data/` pasan.

**Decisiones del PO que usa el plan**: P1 (b), todo es obligatorio menos el correo y hay un máximo de 100 caracteres; P2, al teléfono se le quitan espacios y guiones y deben quedar de 7 a 10 dígitos, y se guarda tal como se escribió; P3 (a), el correo es opcional y, si se escribe, debe tener forma de correo; P4 (a); P5 (c); P6 `activo`; P7, el vendedor que registra y su zona; P8 (b); P9 (a); P10 (a); P11 (b), el PA se pasa a mayúsculas y el RT sin guion se rechaza. Los mensajes de error [Propuesta] de la historia están aprobados.

**Propuestas técnicas que nadie ha aprobado todavía** (el PO solo aprobó los mensajes). El plan las usa y las marca con **[POR DEFINIR: PTn]** en cada paso que depende de ellas. Las debe confirmar el arquitecto o el tech lead:
- PT1. La ruta `POST /api/tenderos`, los campos del contrato (`vendedorId`, `tipoDocumento`, `numeroDocumento`, `nombre`, `nombreTienda`, `telefono`, `correo`, `direccion`) y la respuesta 201 con `{ tendero }`.
- PT2. `zona` y `estado` que llegan en el cuerpo se ignoran en vez de rechazarse (CA3).
- PT3. Un texto con solo espacios cuenta como vacío (CA18).
- PT4. La API valida primero el cuerpo (400) y después busca el vendedor (404).
- PT5. La ruta web `/tenderos/nuevo` y el texto del enlace «Registrar tendero».
- PT6. El formulario valida solo los campos obligatorios y la longitud máxima; las reglas de documento, teléfono y correo quedan solo en la API.

Al aprobar el plan, un commit inicial guarda este documento como `docs/planes/HU-101-plan.md` junto con los dos archivos de la historia, que hoy están sin seguimiento. Ese commit no es un paso del plan: solo agrega documentos y no cambia código.

---

## Paso 1 · Validador del documento (función pura)

- **Objetivo:** normalizar y validar DI, RT y PA según el anexo, sin tocar rutas.
- **Archivos:** crea `apps/api/src/validaciones/documento.ts` y `apps/api/test/documento.test.ts`.
- **Qué hace:**
  - `normalizarDocumento(tipo, numero)` quita espacios y puntos; en PA, además, pasa a mayúsculas (P11 b).
  - `validarDocumento(tipo, numero)` devuelve el número normalizado o el mensaje aprobado del tipo que corresponde:
    - DI: `^\d{6,10}$`.
    - RT: `^\d{9}-\d$` más el dígito de control, con pesos del 2 al 10 desde la derecha y residuo 10 → 0.
    - PA: `^[A-Z0-9]{6,9}$`, aplicado después de pasar a mayúsculas.
  - `digitoControlRT(base)` se exporta aparte.
- **Cómo se comprueba:**
  - **Punto de partida, antes de escribir código:** `npm install`, `npm test`, `npm run lint` y `npm run test:e2e` (con el puerto 3001 libre) terminan sin errores; el último informa «2 passed». Si algo falla, me detengo y aviso antes de empezar.
  - `npm test -w apps/api -- documento` → todas las pruebas de `documento.test.ts` pasan. Casos:
    - DI: `999123`, `9991234567` válidos; `99912`, `99912345678`, `99912A` inválidos; `999.124.001` → `999124001`.
    - RT: `999123456-1`, `999000013-0`, `999000005-0` válidos; `999123456-2`, `99912345-6`, `9991234561` inválidos; `999 000 024-4` → `999000024-4`.
    - PA: `999ABC`, `999ABCDEF`, `999123456` válidos; `999abc` → `999ABC`; `999AB`, `999ABCDEFG`, `999ÁBC`, `999AB-C` inválidos.
    - Todos los documentos de `test-data/tenderos.json` pasan el validador, con `999200355-8` entre ellos.
  - Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre (a nivel de unidad):** CA4, CA5, CA6, CA7, CA8, CA9, CA10, CA11, CA12.

## Paso 2 · Esquema zod del registro

- **Objetivo:** validar en la API todos los campos del registro con una sola definición.
- **Archivos:** crea `apps/api/src/validaciones/tendero.ts` y `apps/api/test/validacion-tendero.test.ts`.
- **Qué hace:** `esquemaRegistroTendero` (zod 4) sobre los campos del contrato [POR DEFINIR: PT1], con estas reglas:
  - `vendedorId`: entero positivo.
  - `tipoDocumento`: `DI`, `RT` o `PA`.
  - `numeroDocumento`: se delega en el paso 1 con `superRefine`/`transform`.
  - `nombre`, `nombreTienda`, `direccion`: obligatorios, de 1 a 100 caracteres después de `trim` [POR DEFINIR: PT3]. Qué valor se entrega para guardar, recortado o tal como llegó, queda [POR DEFINIR: D2].
  - `telefono`: obligatorio. Sin espacios ni guiones debe tener de 7 a 10 dígitos; se devuelve el valor original para guardarlo (P2). Este paso no cambia la columna, que sigue admitiendo nulos [POR DEFINIR: D6].
  - `correo`: opcional; si viene, debe cumplir `^[^\s@]+@[^\s@]+\.[^\s@]+$` (P3 a). La cadena vacía cuenta como «no escrito» [POR DEFINIR: D4].
  - Las claves desconocidas (`zona`, `estado`) se descartan, que es lo que `z.object` hace por defecto [POR DEFINIR: PT2].
  - Una función `primerError(resultado)` devuelve el mensaje del primer campo que falla [POR DEFINIR: D3].
  - **Mensajes:** cada regla lleva su mensaje explícito, también los errores de tipo (con la opción `error` de zod 4). Así ningún mensaje por defecto de zod, que está en inglés y es técnico, llega al cliente. El módulo exporta la lista `MENSAJES` con todos los textos posibles. Las reglas sin texto aprobado usan la constante `MENSAJE_POR_DEFINIR`, cuyo texto es [POR DEFINIR: D1] y se reemplaza al cerrar D1.
- **Cómo se comprueba:** `npm test -w apps/api -- validacion-tendero` → todo pasa. Casos:
  - `nombreTienda: "   "` → «El nombre de la tienda es obligatorio.»
  - `telefono: "abc"`, `"555 000"` y 11 dígitos se rechazan; `"555-0101"` y `5550000001` pasan.
  - `correo: "sin-arroba"` se rechaza; correo ausente pasa.
  - Un texto de 101 caracteres se rechaza.
  - `zona`/`estado` no aparecen en el resultado.
  - Con `{}`, `vendedorId: "abc"`, `tipoDocumento: 5` y `nombre: 123`, `primerError` devuelve un texto que está en `MENSAJES`.
  - Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre:** CA3, CA18, CA19, CA20 (a nivel de unidad).
- **[POR DEFINIR: D1]:** faltan los textos de los mensajes para teléfono inválido, correo inválido, campos obligatorios distintos del nombre de la tienda, más de 100 caracteres, tipo de documento ausente o inválido y `vendedorId` ausente. Mientras no se definan, las pruebas afirman el 400 y que `error` está en `MENSAJES`, pero no el texto exacto.

## Paso 3 · Migración: documento único por tipo y número

- **Objetivo:** que la base impida dos tenderos con el mismo tipo y número, también cuando llegan dos envíos al mismo tiempo.
- **Archivos:** crea `apps/api/migrations/002_tenderos_documento_unico.sql` y `apps/api/test/migraciones.test.ts`.
- **Qué hace:** `CREATE UNIQUE INDEX IF NOT EXISTS tenderos_documento_unico ON tenderos (tipo_documento, numero_documento);`. No se edita `001_inicial.sql`.
- **Cómo se comprueba:**
  - `npm test -w apps/api -- migraciones` → pasa. La prueba abre `:memory:`, comprueba que `migraciones` contiene `002_…` y que `test-data/` carga sin error. Luego inserta con parámetros un `DI 999123456` dos veces y la segunda falla con `UNIQUE constraint failed`; un `PA 999123456` sí entra.
  - Localmente, `npm run db:reset` termina sin error.
  - `npm run test:e2e` (con el puerto 3001 libre) → «2 passed»: la API arranca con la migración nueva.
  - Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre (base de datos):** CA13, CA14, CA15, CA17.

## Paso 4 · `POST /api/tenderos`: registro válido y errores de validación

- **Objetivo:** crear el tendero con la zona del vendedor y el estado `activo`, y responder 400 o 404 con `{ error }`.
- **Archivos:** modifica `apps/api/src/routes/tenderos.ts` y `apps/api/test/ayuda.ts`; crea `apps/api/test/registro-tendero.test.ts`.
- **Antes de ejecutarlo:** hay que cerrar PT1, PT2, PT3, PT4 y D2, porque el código y las pruebas de este paso dependen de ellas.
- **Qué hace:**
  - `router.post('/')` [POR DEFINIR: PT1] sigue este orden [POR DEFINIR: PT4]:
    1. `safeParse`; si falla, 400 `{ error: primerError }`.
    2. `SELECT zona FROM vendedores WHERE id = ?`; si no existe, 404 «Vendedor no encontrado.»
    3. `INSERT … VALUES (?, …)` con `zona` del vendedor, `vendedor_id` del cuerpo (P7 a), `estado 'activo'` (P6), el número de documento normalizado y los textos como se decida en [POR DEFINIR: D2].
    4. 201 `{ tendero }` leído con `COLUMNAS` [POR DEFINIR: PT1].
  - En `ayuda.ts` se agregan `idVendedor(app, 'V-101')`, que hace `POST /api/sesion` como pide la historia, y `datosBase(extra)` con los datos válidos base.
  - El mensaje 404 existente de `GET` («Vendedor no encontrado», sin punto) no se cambia.
- **Cómo se comprueba:** `npm test -w apps/api -- registro-tendero` → pasa, con una prueba por CA y cada una sobre `appDePrueba()` nuevo:
  - CA1: 201 y fila con zona Norte, `vendedor_id` de V-101 y estado `activo`.
  - CA2: el tendero aparece en `GET ?vendedorId=` de V-101 y no en el de V-102.
  - CA3: con `zona: "Sur"` y `estado: "inactivo"` queda en Norte y `activo` [POR DEFINIR: PT2].
  - CA4, CA6, CA9 y CA12 (guardado normalizado).
  - CA11: `999abc` → 201; que se guarde como `999ABC` queda [POR DEFINIR: D9].
  - CA14: con un `DI 999123456` previo, `PA 999123456` → 201.
  - CA5, CA7, CA8, CA10 y CA21: 400 con el mensaje exacto y `COUNT(*)` sin cambios.
  - CA18: 400 con el mensaje [POR DEFINIR: PT3]. CA19 y CA20: 400 [POR DEFINIR: D1 en el texto].
  - CA23: `D'Luis` se guarda idéntico.
  - CA24: 404 y nada creado.
  - Sin mensajes por defecto de zod: con `{}` y con `vendedorId: "abc"` responde 400 y `error` está en `MENSAJES`.
  - Comprobación manual:
    - Terminal 1: `npm run db:reset && npm run dev`, que queda corriendo.
    - Terminal 2: `curl -s -w '\n%{http_code}\n' -X POST localhost:3001/api/tenderos -H 'Content-Type: application/json' -d '{"vendedorId":1,"tipoDocumento":"DI","numeroDocumento":"999124001","nombre":"Prueba Norte","nombreTienda":"Tienda Prueba Norte","telefono":"5550000001","correo":"prueba@ejemplo.test","direccion":"Dirección de prueba 1"}'`.
    - Resultado esperado: un cuerpo `{"tendero":{…,"zona":"Norte",…,"estado":"activo"}}` y, en la última línea, `201`.
  - Después, `npm test` y `npm run lint` terminan sin errores.
  - En este paso un duplicado todavía produce 500. Ninguna prueba lo ejercita hasta el paso 5.
- **CA que cubre:** CA1, CA2, CA3, CA4, CA5, CA6, CA7, CA8, CA9, CA10, CA11, CA12, CA14, CA18, CA19, CA20, CA21, CA23, CA24.

## Paso 5 · Duplicados: 409 activo, inactivo, otra zona y doble envío

- **Objetivo:** responder 409 con el mensaje aprobado en lugar de 500 cuando el documento ya existe.
- **Archivos:** modifica `apps/api/src/routes/tenderos.ts` y `apps/api/test/registro-tendero.test.ts`.
- **Antes de ejecutarlo:** hay que cerrar D5, porque decide qué consulta se escribe.
- **Qué hace:**
  - El `INSERT` de `POST /api/tenderos` [POR DEFINIR: PT1] va dentro de un `try`. Si el error es de restricción única (`errcode` 2067 o mensaje `UNIQUE constraint failed`), se consulta el estado del tendero existente con parámetros:
    - `inactivo` → 409 «Este tendero ya está registrado y está inactivo. Comunícate con la oficina comercial.» (P5 c).
    - Cualquier otro estado → 409 «Este tendero ya está registrado.», sin datos de zona (P4 a).
  - Si el mensaje de inactivo se da también cuando el tendero es de otra zona, o si ahí se responde solo el mensaje de P4, queda [POR DEFINIR: D5]. Según lo que se decida, la consulta filtra o no por la zona del vendedor.
  - Los demás errores siguen al manejador de 500.
  - No se hace una consulta previa: el índice es la única fuente de verdad, lo que cubre CA17.
- **Cómo se comprueba:** `npm test -w apps/api -- registro-tendero` → pasa:
  - CA13: `999123456` y luego `999.123.456` → 409 con el mensaje y un solo tendero con ese DI.
  - CA15: V-101 y luego V-102 → 409 con cuerpo exactamente `{ error: "Este tendero ya está registrado." }`.
  - CA16: se inserta con parámetros en la preparación un `DI 999124006` con estado `inactivo` en la zona Norte → 409 con el mensaje de P5. El caso de otra zona se prueba según D5.
  - CA17: `Promise.all` de dos `POST` con `999124003` → estados `[201, 409]` en cualquier orden y `COUNT(*) = 1`.
  - Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre:** CA13, CA15, CA16, CA17.

## Paso 6 · Formulario «Registrar tendero» en la web

- **Objetivo:** que el vendedor registre desde el portal y vea el error de la API sin perder lo escrito.
- **Archivos:**
  - Modifica `apps/web/src/lib/api.ts`: tipo `DatosRegistroTendero` y `registrarTendero(datos)` → `POST /api/tenderos` [POR DEFINIR: PT1].
  - Crea `apps/web/src/pages/RegistrarTendero.tsx`.
  - Modifica `apps/web/src/App.tsx` (ruta protegida `/tenderos/nuevo`) y `apps/web/src/pages/Tenderos.tsx` (enlace «Registrar tendero») [POR DEFINIR: PT5].
  - Crea `apps/web/test/RegistrarTendero.test.tsx`.
- **Qué hace:**
  - El formulario tiene un `select` de tipo (DI/RT/PA), número, nombre, nombre de la tienda, teléfono, correo y dirección.
  - `vendedorId` se toma de `useSesion()`.
  - La validación del cliente se limita a `required` (todo menos el correo) y `maxLength={100}` [POR DEFINIR: PT6]. La validación que exige el criterio e) está en la API (pasos 1, 2 y 4).
  - Si falla, muestra `err.message` en `<p role="alert">` y no reinicia el estado de los campos.
- **Cómo se comprueba:**
  - `npm test -w apps/web -- RegistrarTendero` → pasa. La prueba usa `vi.mock('../src/lib/sesion')` con V-101 y `fetch` simulado:
    - Envía el cuerpo con `vendedorId: 1` y los campos escritos.
    - Ante un 409 con el mensaje de CA13, muestra la alerta y los campos conservan `999.123.456`, «Tienda Prueba Norte», etc.
    - Ante un 400 de DI inválido, muestra el mensaje de CA5.
  - `npm run test:e2e` (con el puerto 3001 libre) → «2 passed»: el enlace nuevo no rompe `navegacion.spec.ts`.
  - Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre:** CA22, más CA13 y CA5 vistos desde el formulario.

## Paso 7 · Después de guardar: volver a la lista con «Tendero registrado»

- **Objetivo:** tras un registro exitoso, volver a la lista de tenderos y mostrar el mensaje «Tendero registrado» (P9 a).
- **Archivos:** modifica `RegistrarTendero.tsx` y `Tenderos.tsx`; crea `apps/web/test/Tenderos.test.tsx`; amplía `RegistrarTendero.test.tsx`.
- **Qué hace:**
  - Si el registro responde 201, hace `navigate('/tenderos', { state: { mensaje: 'Tendero registrado' } })`.
  - `Tenderos` muestra `location.state.mensaje` en `<p role="status">` y recarga la lista.
- **Cómo se comprueba:**
  - `npm test -w apps/web` → pasa:
    - Con un 201 simulado, la ruta cambia a `/tenderos` y se ve «Tendero registrado».
    - `Tenderos` con ese `state` muestra el mensaje y sin él no lo muestra.
  - `npm run test:e2e` (con el puerto 3001 libre) → «2 passed».
  - Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre:** CA25.

## Paso 8 · Prueba de extremo a extremo del registro

- **Objetivo:** recorrer el flujo real web → API → SQLite.
- **Archivos:** crea `e2e/registro-tendero.spec.ts`.
- **Qué hace:** los dos tests recorren el flujo que usa `POST /api/tenderos` [POR DEFINIR: PT1] y la ruta y el enlace de PT5:
  - Test 1: ingresa con V-101 → Tenderos → «Registrar tendero» → llena los datos válidos base con DI `999124011` → Guardar → ve «Tendero registrado» y «Tienda Prueba Norte» en la tabla.
  - Test 2: registra DI `999123456` y vuelve a intentarlo con `999.123.456` → ve «Este tendero ya está registrado.» y los campos conservan lo escrito.
- **Cómo se comprueba:** con el puerto 3001 libre (para que Playwright levante la API con `PORTAL_DB=:memory:`), `npm run test:e2e` → «4 passed»: los 2 tests actuales más los 2 nuevos. Comprobación manual equivalente: `npm run db:reset && npm run dev`, entrar con `V-101` en http://localhost:5173 y repetir los dos recorridos. Después, `npm test` y `npm run lint` terminan sin errores.
- **CA que cubre:** CA25, CA22, CA13 y CA2 de extremo a extremo.

---

## Cobertura de los criterios

| Criterio | Pasos | Pruebas |
|---|---|---|
| CA1 | 4 | `registro-tendero.test.ts` «CA1» |
| CA2 | 4, 8 | `registro-tendero.test.ts` «CA2»; `e2e/registro-tendero.spec.ts` test 1 |
| CA3 | 2, 4 | `validacion-tendero.test.ts`; `registro-tendero.test.ts` «CA3» [POR DEFINIR: PT2] |
| CA4 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA4» |
| CA5 | 1, 4, 6 | `documento.test.ts`; `registro-tendero.test.ts` «CA5»; `RegistrarTendero.test.tsx` |
| CA6 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA6» |
| CA7 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA7» |
| CA8 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA8» (400, P11) |
| CA9 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA9» |
| CA10 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA10» |
| CA11 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA11» (201; guardado `999ABC` [POR DEFINIR: D9]) |
| CA12 | 1, 4 | `documento.test.ts`; `registro-tendero.test.ts` «CA12» |
| CA13 | 3, 5, 6, 8 | `migraciones.test.ts`; `registro-tendero.test.ts` «CA13»; `RegistrarTendero.test.tsx` (alerta del 409); `e2e/registro-tendero.spec.ts` test 2 |
| CA14 | 3, 4 | `migraciones.test.ts`; `registro-tendero.test.ts` «CA14» |
| CA15 | 3, 5 | `registro-tendero.test.ts` «CA15» |
| CA16 | 5 | `registro-tendero.test.ts` «CA16» (misma zona; otra zona [POR DEFINIR: D5]) |
| CA17 | 3, 5 | `migraciones.test.ts`; `registro-tendero.test.ts` «CA17» |
| CA18 | 2, 4 | `validacion-tendero.test.ts`; `registro-tendero.test.ts` «CA18» [POR DEFINIR: PT3] |
| CA19 | 2, 4 | `validacion-tendero.test.ts`; `registro-tendero.test.ts` «CA19» [POR DEFINIR: D1] |
| CA20 | 2, 4 | `validacion-tendero.test.ts`; `registro-tendero.test.ts` «CA20» [POR DEFINIR: D1] |
| CA21 | 4 | `registro-tendero.test.ts` «CA21» |
| CA22 | 6, 8 | `RegistrarTendero.test.tsx`; `e2e/registro-tendero.spec.ts` test 2 |
| CA23 | 4 | `registro-tendero.test.ts` «CA23» |
| CA24 | 4 | `registro-tendero.test.ts` «CA24» |
| CA25 | 7, 8 | `RegistrarTendero.test.tsx`; `Tenderos.test.tsx`; `e2e/registro-tendero.spec.ts` test 1 |

## Riesgos y dudas

**Sin decidir con este material (no lo decido yo)**
- **PT1 a PT6:** son propuestas técnicas que el PO no aprobó (solo aprobó los mensajes): la ruta, el contrato y el 201; ignorar `zona`/`estado`; un texto de solo espacios como vacío; validar el cuerpo antes de buscar el vendedor; la ruta web y el texto del enlace; y el alcance de la validación del formulario. Hace falta la confirmación del arquitecto o del tech lead: PT1 a PT4 antes del paso 2 (PT1) y del paso 4; PT5 y PT6 antes del paso 6.
- **D1:** faltan los textos de error para teléfono, correo, campos obligatorios distintos del nombre de la tienda, más de 100 caracteres, tipo de documento y `vendedorId` ausente o inválido.
- **D2:** si los textos se guardan con `trim` o tal como llegan. P2 solo lo dice para el teléfono; CA23 exige guardar `D'Luis` idéntico.
- **D3:** qué mensaje se devuelve cuando fallan varios campos a la vez, porque el formato `{ error }` admite uno solo.
- **D4:** si un correo vacío o de solo espacios cuenta como «no escrito».
- **D5:** CA16 no dice si el mensaje de «inactivo» se da también cuando el tendero inactivo es de otra zona. Hacerlo revela a V-102 un dato de otra zona, en tensión con P4 (a) y con la regla 1 del contexto.
- **D6:** P1 hace obligatorio el teléfono, pero 4 tenderos de `test-data/` no lo tienen y la columna admite nulos. El plan exige el teléfono solo en la API y no cambia la columna ni los datos. Si se quiere `NOT NULL`, hace falta decidir qué pasa con esos registros (y HU-102).
- **D7:** no hay contrato OpenAPI en el repositorio. Hay que decidir si el endpoint nuevo se documenta en el contrato (sin ejemplos en línea, regla 14) o en la tabla de endpoints de `docs/contexto-del-portal.md`, y quién lo aprueba.
- **D8:** P2 y P3 dicen que las reglas de teléfono y correo valen también para HU-102. El plan deja el esquema en `validaciones/tendero.ts` para reutilizarlo, pero no toca la edición.
- **D9:** P11 (b) dice que el PA se pasa a mayúsculas antes de validar, pero no dice que se guarde en mayúsculas. Guardarlo así se deduce de CA12 (se guarda normalizado) y de que el tendero se identifica por tipo y número (si no, `999abc` y `999ABC` serían dos tenderos). Es una deducción, no una respuesta.

**Lo que puede fallar en la implementación**
- **Detección del error de unicidad en `node:sqlite`:** el campo (`errcode` o `code`) y su texto pueden cambiar entre versiones de Node, que es experimental en Node 22. Si se detecta mal, un duplicado cae en 500. La prueba de CA13 lo detectaría.
- **CA17 en un solo proceso:** `node:sqlite` es síncrono y las dos peticiones de Supertest no se intercalan de verdad. La prueba confirma el resultado; la garantía ante concurrencia real la da el índice único (paso 3).
- **Migración 002 sobre una base local existente:** si alguien creó duplicados a mano en `apps/api/data/portal.db`, la migración falla al arrancar. La salida es `npm run db:reset`.
- **Pruebas de extremo a extremo:** `reuseExistingServer` reutiliza una API que ya esté corriendo (con su base local), y la base en memoria se comparte entre tests del mismo recorrido. Eso contradice la condición «cada prueba arranca solo con `test-data/`». Por eso CA22 y CA25 se cubren también con pruebas de componente, que sí arrancan limpias. Por la misma razón, `npm run test:e2e` debe correr con el puerto 3001 libre en todos los pasos que lo usan.
- **Mayúsculas del PA:** `toUpperCase` convierte `á` en `Á`, que sigue siendo inválido (CA10 correcto), pero caracteres como `ß` se convierten en `SS` y podrían volverse válidos. Hay que cubrirlo con una prueba si se considera relevante.
- **Formulario:** no usa `type="email"` para que el navegador no aplique una regla distinta de la de P3. La validación real queda solo en la API.
- **Regla 13:** los datos de las pruebas son los de la historia (prefijo `999`, `555`, `ejemplo.test`). El estado `inactivo` de CA16 se crea en la preparación de la prueba, no en `test-data/`. Si se quisiera en los datos base, iría por `test-data/generar.mjs`.
