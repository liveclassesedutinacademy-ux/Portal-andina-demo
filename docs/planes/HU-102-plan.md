# Plan de implementación · HU-102 «Edición de datos del tendero»

## Contexto

La pantalla `apps/web/src/pages/EditarTendero.tsx` ya existe, carga el tendero con `GET /api/tenderos/:id` y llama a `api.actualizarTendero` (`PUT /api/tenderos/:id`, en `apps/web/src/lib/api.ts`). Ese endpoint todavía no existe. Tampoco hay validación de los campos ni vuelta a la lista. La historia reescrita y las respuestas del product owner (P1 a P10) fijan las reglas:

- **Campos editables (P1 c):** `nombre`, `nombreTienda`, `telefono`, `correo` y `direccion`. El documento, la zona, el vendedor y el estado no se editan (P2 no aplica).
- **Teléfono (P3):** para validar se quitan los espacios y los guiones, y lo que queda deben ser solo dígitos, de 7 a 10. Se guarda tal como lo escribió el vendedor.
- **Obligatorios (P4 b):** el teléfono es obligatorio. El correo es opcional y un correo vacío se guarda como `NULL`.
- **Normalización (P5):** se quitan los espacios del inicio y del final de todos los campos, y cada campo admite máximo 100 caracteres. El correo **no** pasa a minúsculas. Esto reemplaza la [Propuesta] de CA8: se guarda `Tendero3@Ejemplo.TEST`.
- **Tendero inactivo (P6 b):** responde 409 con «Este tendero está inactivo y no se puede editar.», y el formulario no deja editarlo.
- **Vuelta a la lista (P7):** al guardar, el vendedor vuelve a la lista con «Datos actualizados». El teléfono se ve en la lista y el correo se comprueba al volver a abrir la edición.
- **Mensajes (P8 a):** los mensajes [Propuesta] quedan aprobados.
- **Correo válido (P9 a):** se usa la regla de correo de zod.
- **Otra zona (P10 a):** responde 403 con «Este tendero no es de tu zona.».
- **Tendero inactivo en las pruebas:** se crea en la preparación de cada prueba y no se agrega a `test-data/`.

**Esquema:** no hace falta ninguna migración. Las columnas existen en `001_inicial.sql` y el documento no se edita, así que no se necesita un índice único. Si la implementación descubre un cambio de esquema, irá en `002_*.sql` y no en `001`.

**Antes del paso 1** (no es un paso del plan):
- Crear la rama `hu-102-edicion-tendero`.
- Confirmar las dos historias sin seguimiento que hay en `docs/historias/`.
- Guardar este plan aprobado en `docs/planes/HU-102-edicion-de-datos-del-tendero.md`.

**Regla para todos los pasos:** al terminar cada paso, `npm test` pasa con 0 pruebas fallidas y `npm run lint` termina sin errores (código de salida 0). Después se hace un commit por paso.

---

## Paso 1 · Esquema de validación de la edición en la API

- **Objetivo:** un esquema zod reutilizable que aplique en la API las reglas de P1, P3, P4, P5 y P9.
- **Archivos:** crea `apps/api/src/validacion/tendero.ts` y `apps/api/test/validacion-tendero.test.ts`.
- **Qué hace:** exporta `esquemaEdicionTendero` y una función `validarEdicionTendero(cuerpo)`. La función devuelve `{ ok: true, datos }`, o `{ ok: false, campo, mensaje }` con el primer problema.
  - El objeto es estricto (`z.strictObject`) y solo acepta los 5 campos editables. Cualquier otro campo (`zona`, `estado`, `vendedorId`, `tipoDocumento`, `numeroDocumento`) produce un error.
  - Todos los campos se recortan con `trim` **antes** de validarlos y admiten máximo 100 caracteres.
  - Teléfono: tiene que estar presente y no vacío. Se valida sobre el valor sin espacios ni guiones: solo dígitos, de 7 a 10. Un teléfono con letras produce «El teléfono solo puede tener números.».
  - **[POR DEFINIR]** Qué significa «se guarda tal como lo escribió» (P3). La [Propuesta] es guardar el valor recortado (P5) con sus espacios y guiones, así que `555 123 4567` se guarda como `555 123 4567`. La otra lectura es guardarlo sin recortar. Las pruebas de este punto se ajustan cuando se decida.
  - Correo: `null` o `""` se convierten en `null`. Cualquier otro valor pasa por la regla de correo de zod y, si falla, produce «El correo no es válido.». No se cambian las mayúsculas.
  - El esquema queda en su propio módulo para que HU-101 pueda reutilizar la regla del teléfono y la del correo («misma regla del registro»).
  - **[POR DEFINIR]** Los mensajes de estos casos (ver «Riesgos y dudas», punto 1):
    - teléfono vacío;
    - teléfono con menos de 7 o más de 10 dígitos;
    - campo con más de 100 caracteres;
    - campo no permitido.

    Mientras no se decidan, las pruebas comprueban `ok: false` y el `campo`, pero no el texto.
  - **[POR DEFINIR]** Si `nombre`, `nombreTienda` y `direccion` pueden quedar vacíos (P4 solo habla del teléfono y el correo). Las pruebas de esos casos se escriben cuando se decida.
- **Cómo se comprueba:** `npm test -w apps/api -- validacion-tendero`. Pasan los casos de estos valores:
  - `5559876543` → `ok: true`.
  - `555 123 4567` → `ok: true`, con el valor guardado según el [POR DEFINIR] de P3; con la [Propuesta], `555 123 4567`.
  - `555-ABC-1234` → `ok: false`, `campo: 'telefono'`, mensaje «El teléfono solo puede tener números.».
  - `555` → `ok: false`, `campo: 'telefono'`.
  - `5551234567890123` → `ok: false`, `campo: 'telefono'`.
  - Teléfono `""` → `ok: false`, `campo: 'telefono'`.
  - Correo `esquina.ejemplo.test` → `ok: false`, `campo: 'correo'`, mensaje «El correo no es válido.».
  - Correo `tendero3.ejemplo.test` → `ok: false`, `campo: 'correo'`, mensaje «El correo no es válido.».
  - Correo `""` → `ok: true` con `correo: null`.
  - Correo ` Tendero3@Ejemplo.TEST ` → `ok: true` con `correo: 'Tendero3@Ejemplo.TEST'`.
  - `nombre` de 101 caracteres → `ok: false`, `campo: 'nombre'`.
  - `{ zona: 'Sur', estado: 'inactivo' }` → `ok: false`.

  Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA4, CA5, CA6, CA7 y CA8 a nivel de esquema, y CA12 a nivel de esquema.

## Paso 2 · Endpoint `PUT /api/tenderos/:id` (guardar)

- **Objetivo:** guardar los 5 campos editables con una consulta con parámetros y responder con el tendero actualizado.
- **Archivos:**
  - modifica `apps/api/src/routes/tenderos.ts`;
  - modifica `apps/api/src/app.ts`: un JSON mal formado responde 400 en lugar de 500;
  - modifica `apps/api/test/tenderos.test.ts` (nuevo `describe('PUT /api/tenderos/:id')`).
- **Qué hace:**
  - **[POR DEFINIR]** El orden de las comprobaciones cuando una petición falla por más de un motivo. La [Propuesta] de este paso, que el paso 3 completa:
    1. Id no numérico → 400 `{ "error": "El id del tendero debe ser un número." }`.
    2. Tendero que no existe → 404 `{ "error": "No encontramos este tendero." }`.
    3. Cuerpo validado con el esquema del paso 1 → 400 `{ "error": <mensaje> }`.
    4. `UPDATE tenderos SET nombre = ?, nombre_tienda = ?, telefono = ?, correo = ?, direccion = ? WHERE id = ?`.
    5. Se relee con `COLUMNAS` y se responde 200 `{ tendero }`, que es lo que espera `api.actualizarTendero`.
  - **[POR DEFINIR]** Si el cuerpo lleva siempre los 5 campos o solo los que cambian (CA9 envía solo el teléfono). La [Propuesta] es exigir los 5, como ya los define `DatosEdicionTendero` en `apps/web/src/lib/api.ts`.
  - En `app.ts`, el manejador de errores responde 400 `{ "error": <mensaje> }` cuando el error viene de `express.json()` (`type === 'entity.parse.failed'`), sin el detalle interno. **[POR DEFINIR]** El texto del mensaje.
  - `GET /api/tenderos/:id` no cambia.
- **Cómo se comprueba:** `npm test -w apps/api`. Pruebas nuevas con Supertest, cada una con `appDePrueba()` limpio:
  - **CA2:** teléfono `5559876543` en el tendero 1 → 200, y `GET /api/tenderos/1` devuelve `5559876543`.
  - **CA3:** correo `tendero3@ejemplo.test` en el tendero 3 → 200, y `db.prepare('SELECT correo FROM tenderos WHERE id = ?').get(3)` devuelve ese correo.
  - **CA4 y CA13:** `555-ABC-1234` → 400 con el cuerpo exacto, y el teléfono sigue en `555-0101`.
  - **CA5 y CA13:** `esquina.ejemplo.test` → 400 `{ "error": "El correo no es válido." }` (`toEqual` sobre el cuerpo completo), y el correo sigue igual.
  - **CA6:** los tres valores de teléfono. `555 123 4567` → 200 y queda guardado según el [POR DEFINIR] de P3; los otros dos → 400 y el teléfono no cambia.
  - **CA7:** el tendero 4 con teléfono vacío → 400. En el tendero 1 se guarda primero `esquina@ejemplo.test`, luego se guarda con el correo `""` → 200, y la base queda con `NULL`.
  - **CA8:** ` Tendero3@Ejemplo.TEST ` → se guarda `Tendero3@Ejemplo.TEST`.
  - **CA10:** id 9999 → 404 con el mensaje aprobado.
  - **CA11:** id `abc` → 400 con el mensaje aprobado.
  - **CA12:**
    - `{ "zona": "Sur", "estado": "inactivo" }` → 400.
    - El cuerpo válido más `zona`, `estado`, `tipoDocumento` y `numeroDocumento` → 400.
    - En los dos casos, `GET` sigue devolviendo `zona` `Norte`, el mismo estado y el mismo documento.
  - **CA14:** nombre `D'Luis` → 200, y `GET` devuelve exactamente `D'Luis`.
  - **CA15, CA19 y CA20:** se envían los datos de cada criterio en el cuerpo del tendero 1, junto con los 5 campos válidos:
    - `tipoDocumento: 'RT'`, `numeroDocumento: '999123456-2'` (CA15);
    - el tipo y el número de «Minimercado El Roble» (CA19);
    - `tipoDocumento: 'RT'`, `numeroDocumento: '999123456-1'` (CA20).

    Con P1 c y P2, los tres responden 400, y `GET` devuelve el documento original, `DI 999100137`. **[POR DEFINIR]** Estos criterios contradicen P1 c y P2: CA15 espera otro mensaje, CA19 espera 409 y CA20 espera 200. La historia debe corregirse para retirarlos o reescribirlos como «el documento no se edita».
  - **JSON mal formado:** un `PUT /api/tenderos/1` con `Content-Type: application/json` y cuerpo `{mal` → 400, y el cuerpo tiene solo la clave `error`.
  - **CA17:** se reenvían los valores de `GET` del tendero 1 → 200, y `GET` devuelve el mismo objeto.

  Comprobación manual, con `npm run db:reset` y `npm run dev`:

  ```
  curl -i -X PUT http://localhost:3001/api/tenderos/abc -H 'Content-Type: application/json' -d '{}'
  ```

  Responde `HTTP/1.1 400` y `{"error":"El id del tendero debe ser un número."}`.

  Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA2, CA3, CA4, CA5, CA6, CA7, CA8, CA10, CA11, CA12, CA13, CA14 y CA17. También CA15, CA19 y CA20, en su versión compatible con P1 c y P2 (el documento no cambia).

## Paso 3 · Control de zona y de estado en el endpoint

- **Objetivo:** rechazar la edición de un tendero de otra zona (403) o inactivo (409).
- **Archivos:** modifica `apps/api/src/routes/tenderos.ts` y `apps/api/test/tenderos.test.ts`. Este paso no toca la web; el cliente se adapta en el paso 5.
- **Qué hace:**
  - La edición recibe el vendedor que la hace. **[POR DEFINIR]** Cómo llega la identidad del vendedor: no hay autenticación en el sprint. La [Propuesta] es `?vendedorId=` en la consulta, igual que en `GET /api/tenderos`, para no mezclarlo con el cuerpo estricto. Cuando falta el vendedor o no existe, la [Propuesta] es responder 400; el mensaje está [POR DEFINIR].
  - Después del 404 y antes de validar el cuerpo:
    - si la zona del vendedor es distinta de la del tendero → 403 `{ "error": "Este tendero no es de tu zona." }`;
    - si `estado = 'inactivo'` → 409 `{ "error": "Este tendero está inactivo y no se puede editar." }`.
  - **[POR DEFINIR]** Dentro del orden del paso 2: qué responde un tendero inactivo de otra zona. La [Propuesta] es 403, porque la zona se comprueba primero.
  - El cliente web todavía no envía `vendedorId`, así que guardar desde el formulario no funciona hasta el paso 5. Antes de esta historia tampoco funcionaba, porque el endpoint no existía.
- **Cómo se comprueba:** `npm test -w apps/api`.
  - **CA9:** `V-101` (`vendedorId=1`) sobre «Minimercado Los Pinos» (id 7) con teléfono `5551112222` → 403 con el cuerpo exacto, y `GET /api/tenderos/7` devuelve lo mismo que antes.
  - **CA16:** en la preparación de la prueba se inserta un tendero de la zona Norte con `estado = 'inactivo'`, con valores inventados (documento `999…`, teléfono `555…`) e `INSERT` con parámetros. Luego un `PUT` con `vendedorId=1` → 409 con el mensaje aprobado, y la base no cambia.
  - **Sin vendedor:** un `PUT /api/tenderos/1` sin `vendedorId` → 400 (la [Propuesta]), y el tendero no cambia.
  - Las pruebas del paso 2 se actualizan para enviar `vendedorId=1` y siguen pasando.

  Comprobación manual, con `npm run db:reset` y `npm run dev`:

  ```
  curl -i -X PUT 'http://localhost:3001/api/tenderos/7?vendedorId=1' -H 'Content-Type: application/json' -d '{"nombre":"Rosa Demo","nombreTienda":"Minimercado Los Pinos","telefono":"5551112222","correo":"tienda7@ejemplo.test","direccion":"Calle Ficticia 21 n.º 17"}'
  ```

  Responde `HTTP/1.1 403` y `{"error":"Este tendero no es de tu zona."}`. Después, `curl http://localhost:3001/api/tenderos/7` sigue devolviendo `"telefono":"555-0107"`.

  Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA9 y CA16 (API).

## Paso 4 · Validación en el formulario (cliente)

- **Objetivo:** el formulario valida con las mismas reglas y mensajes antes de enviar. La API sigue siendo la que decide.
- **Archivos:**
  - crea `apps/web/src/lib/validacionTendero.ts`;
  - crea `apps/web/test/validacionTendero.test.tsx`. El nombre termina en `.test.tsx` porque `vite.config.ts` solo incluye `test/**/*.test.tsx`;
  - modifica `apps/web/package.json` y `package-lock.json`: se agrega `zod` `^4.1.0`, la misma versión que usa la API.
- **Qué hace:**
  - Repite las reglas del paso 1 con zod: recorte, máximo 100 caracteres y regla del teléfono.
  - Para el correo usa la misma regla de zod que la API (P9 a), no una expresión propia, así que la web y la API aceptan y rechazan los mismos correos.
  - Devuelve `null` o el mensaje. Los mensajes [POR DEFINIR] del paso 1 se usan aquí también.
- **Cómo se comprueba:**
  - `npm install` termina sin errores.
  - `npm test -w apps/web -- validacionTendero` pasa con los mismos valores de prueba del paso 1. Los mensajes aprobados se comparan de forma exacta; en los casos con mensaje [POR DEFINIR], la prueba comprueba que el resultado no es `null`.
  - Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA4, CA5, CA6 y CA7 (cliente).

## Paso 5 · Formulario: guardar, mostrar errores y bloquear al inactivo

- **Objetivo:** que `EditarTendero` guarde, muestre los errores sin perder lo escrito y vuelva a la lista.
- **Archivos:**
  - modifica `apps/web/src/lib/api.ts`: `actualizarTendero(id, datos, vendedorId)` envía `?vendedorId=`;
  - modifica `apps/web/src/pages/EditarTendero.tsx`;
  - crea `apps/web/test/ayuda.tsx`;
  - modifica `apps/web/test/EditarTendero.test.tsx`: la prueba actual pasa a usar `ConSesion`.
- **Qué hace:**
  - `apps/web/test/ayuda.tsx` define `ConSesion({ vendedor, children })`, que envuelve en `ProveedorSesion`, llama a `entrar(vendedor)` al montar y muestra los hijos cuando hay sesión. Así no se toca `sesion.tsx`, que es código de producción.
  - Usa `useSesion()` y pasa `vendedor.id` a `api.actualizarTendero`. La firma del cliente y su única llamada cambian en el mismo paso.
  - Antes de enviar valida con el paso 4. Si hay error, lo muestra en `role="alert"` y no llama a la API.
  - Si la API responde con error, muestra `err.message` (el texto de la API) en `role="alert"` y conserva el estado del formulario.
  - **[POR DEFINIR]** Si el mensaje lleva delante el prefijo actual «No se pudo guardar:». Las pruebas usan `toHaveTextContent(mensaje)`, que funciona con o sin prefijo.
  - Si guarda bien, llama a `navigate('/tenderos', { state: { mensaje: 'Datos actualizados' } })`.
  - Si el tendero cargado tiene `estado === 'inactivo'`, se aplica **[POR DEFINIR]** cómo «el formulario no deja entrar» (P6 b). La [Propuesta] es mostrar «Este tendero está inactivo y no se puede editar.», con los campos y el botón deshabilitados. También queda por decidir si el enlace «Editar» se oculta en la lista.
  - **[POR DEFINIR]** Si el documento, la zona y el estado se muestran como solo lectura (CA1). El plan, por defecto, no los agrega. En cualquier caso, los únicos campos editables son los 5 de P1 c.
- **Cómo se comprueba:** `npm test -w apps/web -- EditarTendero`, con `fetch` simulado:
  - **CA1, valores:** la prueba existente sigue pasando: cada campo muestra el valor del `GET`.
  - **CA1, campos editables:** los `textbox` que no están deshabilitados ni son de solo lectura son exactamente 5, con las etiquetas «Nombre del tendero», «Nombre de la tienda», «Teléfono», «Correo» y «Dirección». No hay un campo editable para el documento, la zona ni el estado.
  - **CA4:** se escribe `555-ABC-1234` y se guarda. El `alert` contiene «El teléfono solo puede tener números.», el campo sigue con `555-ABC-1234` y `fetch` no recibe un `PUT`.
  - **CA5:** lo mismo con `esquina.ejemplo.test` y «El correo no es válido.».
  - **Error de la API:** con un `PUT` simulado que responde 403 `{ "error": "Este tendero no es de tu zona." }`, el `alert` contiene ese texto y lo escrito se conserva.
  - **Vendedor en la petición:** la URL del `PUT` que recibe `fetch` es `/api/tenderos/1?vendedorId=1`.
  - **CA16:** con un `GET` simulado que devuelve `estado: 'inactivo'`, `fetch` no recibe ningún `PUT` aunque se intente guardar. Con la [Propuesta], además, se ve «Este tendero está inactivo y no se puede editar.» y los 5 campos y el botón están deshabilitados.
  - **CA18:** cuando el `PUT` responde 200, se navega a `/tenderos`. Una ruta de prueba en `MemoryRouter` muestra el `state.mensaje` «Datos actualizados».

  Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA1, CA4, CA5, CA16 (interfaz) y CA18 (navegación).

## Paso 6 · La lista muestra «Datos actualizados»

- **Objetivo:** al volver de la edición, la lista de tenderos muestra el mensaje y el teléfono nuevo.
- **Archivos:** modifica `apps/web/src/pages/Tenderos.tsx` y crea `apps/web/test/Tenderos.test.tsx`.
- **Qué hace:** lee `useLocation().state?.mensaje` y lo muestra en `role="status"`. La lista vuelve a pedir los datos al montarse, como ya hace, así que el teléfono nuevo aparece. No se agregan columnas (P7).
- **Cómo se comprueba:** `npm test -w apps/web -- Tenderos`. Con `fetch` simulado que devuelve el tendero 1 con `5559876543` y la ruta con `state: { mensaje: 'Datos actualizados' }`, se ven «Datos actualizados» y `5559876543`. Sin `state`, no hay mensaje. Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA18.

## Paso 7 · Prueba de extremo a extremo del flujo de edición

- **Objetivo:** recorrer el flujo real en el navegador, con la API y la base en memoria.
- **Archivos:** crea `e2e/edicion-tendero.spec.ts`.
- **Qué hace:**
  1. `V-101` entra, va a Tenderos y pulsa «Editar» en «Tienda La Esquina».
  2. Comprueba que los campos muestran los valores de `GET /api/tenderos/1`, que obtiene con `request.get` de Playwright.
  3. Escribe `555-ABC-1234`, guarda y ve el mensaje. El campo conserva lo escrito.
  4. Escribe el teléfono `5559876543` y el correo `esquina@ejemplo.test`, guarda y ve «Datos actualizados», y la fila de «Tienda La Esquina» muestra `5559876543`.
  5. Vuelve a abrir la edición de «Tienda La Esquina» y comprueba que el teléfono muestra `5559876543` y el correo muestra `esquina@ejemplo.test` (P7: el correo se comprueba al volver a abrir la edición).
- **Cómo se comprueba:** `npm run test:e2e` → todas las pruebas pasan, las 2 existentes y la nueva. Comprobación manual equivalente: `npm run db:reset`, `npm run dev`, entrar con `V-101` en http://localhost:5173 y repetir el recorrido. Después, `npm test` y `npm run lint` en verde.
- **CA que cubre:** CA1, CA2, CA4 y CA18 (teléfono en la lista y correo al volver a abrir la edición).

---

## Cobertura de criterios

| Criterio | Pasos | Pruebas |
|---|---|---|
| CA1 | 5, 7 | `EditarTendero.test.tsx`: «carga los datos del tendero en el formulario» y «solo los 5 campos de P1 c son editables»; `e2e/edicion-tendero.spec.ts` |
| CA2 | 2, 7 | `tenderos.test.ts` PUT teléfono `5559876543`; e2e |
| CA3 | 2 | `tenderos.test.ts` PUT correo en el tendero 3 con consulta a la base |
| CA4 | 1, 2, 4, 5, 7 | `validacion-tendero.test.ts`; `tenderos.test.ts` 400; `validacionTendero.test.tsx`; `EditarTendero.test.tsx`; e2e |
| CA5 | 1, 2, 4, 5 | `validacion-tendero.test.ts`; `tenderos.test.ts` 400; `validacionTendero.test.tsx`; `EditarTendero.test.tsx` |
| CA6 | 1, 2, 4 | Los mismos archivos, con los tres valores (mensajes de longitud y forma de guardar [POR DEFINIR]) |
| CA7 | 1, 2, 4 | `tenderos.test.ts`: tendero 4 con teléfono vacío → 400; tendero 1 con correo vacío → `NULL` |
| CA8 | 1, 2 | `tenderos.test.ts`: se guarda `Tendero3@Ejemplo.TEST` (P5) |
| CA9 | 3 | `tenderos.test.ts` 403 y el tendero 7 sin cambios |
| CA10 | 2 | `tenderos.test.ts` 404 con el id 9999 |
| CA11 | 2 | `tenderos.test.ts` 400 con el id `abc` |
| CA12 | 1, 2 | `validacion-tendero.test.ts`; `tenderos.test.ts` con zona, estado y documento sin cambios |
| CA13 | 2 | `tenderos.test.ts`: cuerpo exacto con Supertest, sin formulario |
| CA14 | 2 | `tenderos.test.ts` con el nombre `D'Luis` |
| CA15 | 2 | `tenderos.test.ts`: `RT 999123456-2` → 400 y el documento no cambia. [POR DEFINIR]: contradice P1 c y P2, y la historia debe corregirse |
| CA16 | 3, 5 | `tenderos.test.ts` 409 con un tendero inactivo creado en la preparación; `EditarTendero.test.tsx`: no se envía ningún `PUT` (interfaz [POR DEFINIR]) |
| CA17 | 2 | `tenderos.test.ts`: se reenvían los datos del `GET` → 200 sin cambios |
| CA18 | 5, 6, 7 | `EditarTendero.test.tsx` (navegación); `Tenderos.test.tsx`; e2e (teléfono en la lista y correo al volver a abrir la edición) |
| CA19 | 2 | `tenderos.test.ts`: el documento de «Minimercado El Roble» → 400 y el documento no cambia. [POR DEFINIR]: contradice P1 c y P2 |
| CA20 | 2 | `tenderos.test.ts`: `RT 999123456-1` → 400 y el documento no cambia. [POR DEFINIR]: contradice P1 c y P2 |

## Riesgos y dudas

**No se puede decidir con este material:**

1. **Mensajes sin definir.** P8 aprueba solo los de CA4, CA5, CA9, CA10, CA11, CA15 y CA19. Falta el texto de estos casos: teléfono vacío (P4 b), teléfono con menos de 7 o más de 10 dígitos (CA6), campo con más de 100 caracteres (P5), campo no permitido (CA12), vendedor ausente o desconocido, JSON mal formado. Afecta a los pasos 1 a 5.
2. **Nombre, tienda y dirección vacíos.** P4 solo cubre el teléfono y el correo. En la base esas columnas son `NOT NULL`, pero una cadena vacía cabe.
3. **Identidad del vendedor en la edición.** No hay autenticación: la zona se comprueba con un id que manda el cliente, y cualquiera puede falsificarlo. La [Propuesta] es `?vendedorId=`. Falta decidir el código y el mensaje cuando falta o no existe. La protección real queda fuera del sprint (ingreso con contraseña).
4. **Tendero inactivo en la interfaz.** P6 b dice que «el formulario no deja entrar», pero no dice cómo: deshabilitar los campos, redirigir u ocultar «Editar» en la lista, que es otra pantalla.
5. **Solo lectura en CA1.** No está decidido si se muestran el documento, la zona y el estado.
6. **Teléfono «tal como lo escribió».** Queda [POR DEFINIR] en el paso 1. La [Propuesta] es el valor recortado (P5) con sus espacios y guiones.
7. **Comprobación de CA8.** La historia dice que CA8 se comprueba con el tendero 3, y P5 cambia el resultado esperado a `Tendero3@Ejemplo.TEST`. La historia reescrita debería actualizarse para que la revisión no use la [Propuesta] vieja.
8. **CA15, CA19 y CA20.** Contradicen P1 c y P2: esperan que el documento se pueda editar. El plan los prueba en su versión compatible (400 y el documento no cambia). El product owner o quien mantiene la historia debe retirarlos o reescribirlos.
9. **Orden de las comprobaciones.** Queda [POR DEFINIR] en los pasos 2 y 3. La [Propuesta] es id (400) → existe (404) → zona (403) → inactivo (409) → cuerpo (400). Si se elige otro orden, cambian las respuestas de los casos combinados.
10. **Cuerpo completo o parcial.** Queda [POR DEFINIR] en el paso 2. CA9 envía solo el teléfono. Con la [Propuesta] de exigir los 5 campos y comprobar la zona antes que el cuerpo, CA9 responde 403 igual; pero una edición parcial legítima respondería 400.

**Puede fallar en la implementación:**

11. **Teléfonos nulos en `test-data/`.** Los tenderos 4, 8 y 12 no tienen teléfono. Con P4 b no se pueden guardar «sin cambios» (CA17) hasta completar el teléfono. Es coherente con P4 b, pero puede sorprender a quien pruebe.
12. **Mensajes distintos en `GET` y `PUT`.** `GET /api/tenderos/:id` sigue respondiendo «Identificador inválido» y «Tendero no encontrado», mientras que el `PUT` usa los mensajes nuevos. Unificarlos queda fuera de la historia.
13. **`trim` y validación en zod 4.** Si el recorte no ocurre antes de la regla de correo, ` Tendero3@Ejemplo.TEST ` se rechaza. La prueba de CA8 lo detecta. También hay que confirmar que la regla de correo de zod acepta el dominio `.test` y las mayúsculas.
14. **Reglas repetidas en la web y en la API.** El correo usa la misma regla de zod en los dos lados. El teléfono, el recorte y el máximo de 100 caracteres están escritos dos veces, porque no hay un paquete compartido en el monorepo. Las pruebas de los dos lados usan los mismos valores para detectar diferencias.
15. **La prueba e2e cambia datos.** Con `reuseExistingServer` en local, Playwright puede reutilizar un `npm run dev` abierto y cambiar `apps/api/data/portal.db` en lugar de la base en memoria. Hay que cerrar el servidor de desarrollo o hacer `npm run db:reset` después. Además, la base en memoria es compartida entre las pruebas e2e, así que no se debe depender de su orden.
16. **El formulario no guarda entre los pasos 3 y 5.** El paso 3 exige `vendedorId` y la web lo envía desde el paso 5. Las pruebas siguen en verde, pero guardar desde la aplicación no funciona en ese intervalo.
17. **HU-101 en paralelo.** Si agrega su propia migración `002_*` o su propio validador de teléfono y correo, puede chocar con la numeración o duplicar las reglas. Conviene acordar que reutilice `apps/api/src/validacion/tendero.ts`.
