## Qué cambia

El vendedor puede registrar un tendero nuevo desde el portal, con el enlace «Registrar tendero» de la lista de tenderos. La API valida el documento (DI, RT o PA) y los demás datos, asigna la zona del vendedor y el estado `activo`, y rechaza los documentos que ya existen. Al guardar, el vendedor vuelve a la lista y ve «Tendero registrado». Si hay un error, ve el mensaje de la API y el formulario conserva lo que escribió.

Además, hay dos cambios que la historia no pide y salieron de la revisión del código generado (commit `0f999df`, puntos 3.1 y 3.3 de `docs/lista-de-revision-codigo-generado.md`):
- Un JSON mal formado enviado a `/api/tenderos` responde 400 con el mensaje general en lugar de 500 (`apps/api/src/app.ts:18-22`, D10). El manejador solo cubre esa ruta, porque D10 es una decisión del registro de tenderos.
- La lista de tenderos maneja el error de carga y lo muestra en `role="alert"` (`apps/web/src/pages/Tenderos.tsx:13-20`, `:26`); antes la promesa quedaba sin manejar.

## Historia

HU-101 «Registro de tenderos» (`docs/historias/HU-101-registro-de-tenderos.md`).
- Plan aprobado: `docs/planes/HU-101-plan.md`.
- Respuestas del product owner: `docs/historias/HU-101-respuestas-del-product-owner.md`.
- Decisiones del equipo (PT1 a PT6, D1 a D11): `docs/planes/HU-101-decisiones-del-equipo.md`.
- Tabla criterio–prueba con las diferencias respecto del plan: `docs/planes/HU-101-pruebas.md`.

**Siglas:**
- **CA:** criterio de aceptación de la historia.
- **P:** pregunta al product owner y su respuesta.
- **PT:** propuesta técnica del plan, aprobada en las decisiones del equipo.
- **D:** decisión del equipo.
- **DI, RT y PA:** los tipos de documento (documento de identidad, registro tributario y pasaporte).

### Contrato de `POST /api/tenderos`

Todavía no está en `docs/contexto-del-portal.md` (ver D7 en «Riesgos»). Sale de `apps/api/src/routes/tenderos.ts`, `apps/api/src/validaciones/tendero.ts`, `apps/api/src/validaciones/documento.ts` y `apps/api/src/app.ts`.

**Cuerpo (JSON):**
- `vendedorId`: entero positivo.
- `tipoDocumento`: `DI`, `RT` o `PA`.
- `numeroDocumento`: se le quitan los espacios y los puntos, y en PA se pasa a mayúsculas.
- `nombre`, `nombreTienda`, `telefono` y `direccion`: obligatorios, de máximo 100 caracteres, sin los espacios de los extremos.
- `correo`: opcional. Vacío cuenta como no escrito y se guarda nulo.
- Las demás claves, incluidas `zona` y `estado`, se ignoran.

| Código | Cuándo | Cuerpo |
|---|---|---|
| 201 | Registro válido | `{ tendero: { id, tipoDocumento, numeroDocumento, nombre, nombreTienda, telefono, correo, direccion, zona, vendedorId, estado } }`, con el documento normalizado, la zona del vendedor y `estado: "activo"` |
| 400 | El cuerpo no es válido. Se valida antes de buscar el vendedor (PT4) | `{ error }` con el mensaje del primer campo que falla, en el orden del formulario (D3): los tres mensajes de documento de la historia, los de D1, o «Revisa los datos del tendero.» cuando el dato no tiene mensaje aprobado (D10), también si el JSON está mal formado |
| 404 | No existe el vendedor | `{ "error": "Vendedor no encontrado." }` |
| 409 | El tipo y número de documento ya existen | `{ "error": "Este tendero ya está registrado." }`, o el mensaje de inactivo de P5 si el tendero existente está inactivo y es de la zona del vendedor (D5) |
| 500 | Cualquier otro error | `{ "error": "Error interno" }`, del manejador que ya existía |

### Cambios respecto del plan

Detalle en `docs/planes/HU-101-pruebas.md`, «Diferencias con la tabla del plan».
- **CA17:** ya no se prueba con dos `POST` en `Promise.all`, porque con `node:sqlite` síncrono nunca se intercalan. La prueba simula otro envío justo antes del `INSERT`.
- **CA5:** ya no se asigna a `RegistrarTendero.test.tsx`. Esa prueba simula la API y comprueba PT6.
- **CA2:** el e2e solo comprueba la lista de V-101.
- **CA15:** `migraciones.test.ts` no tiene una prueba de CA15, aunque el plan lo menciona en el paso 3.
- **CA16:** D5 define lo que la historia dejaba abierto: el tendero inactivo de otra zona recibe solo el mensaje general.

### Cómo leer el diff

Son 22 archivos y unas 1840 líneas:
- unas 320 de código;
- unas 950 de pruebas;
- unas 570 de documentos (la historia, las respuestas del PO, el plan, las decisiones y la tabla de pruebas).

Orden sugerido:
1. `validaciones/documento.ts`
2. `validaciones/tendero.ts`
3. `migrations/002_tenderos_documento_unico.sql`
4. `routes/tenderos.ts` y `app.ts`
5. En la web: `lib/api.ts`, `pages/RegistrarTendero.tsx`, `App.tsx` y `pages/Tenderos.tsx`
6. Las pruebas
7. Los documentos

### Criterios de aceptación

Rutas de las pruebas usadas en la tabla (**REG** reemplaza a la abreviatura anterior «RT», que se confundía con el tipo de documento):
- **REG**: `apps/api/test/registro-tendero.test.ts`
- **DOC**: `apps/api/test/documento.test.ts`
- **VAL**: `apps/api/test/validacion-tendero.test.ts`
- **MIG**: `apps/api/test/migraciones.test.ts`
- **RTW**: `apps/web/test/RegistrarTendero.test.tsx`
- **TW**: `apps/web/test/Tenderos.test.tsx`
- **E2E**: `e2e/registro-tendero.spec.ts`

La tabla sale del código y de los nombres de las pruebas, no de la tabla del plan.
- Los números de línea corresponden al commit `b1550f4`.
- Los títulos entre comillas son los que muestra Vitest. En las pruebas parametrizadas (`it.each`), el código tiene una plantilla, por ejemplo `'%s: acepta %s %s'` en REG:69. Por eso el título completo no aparece tal cual en el archivo: se busca por la línea indicada.

| Criterio de aceptación | Dónde se cumple | Prueba que lo comprueba |
|---|---|---|
| CA1. Registro válido: 201, zona Norte, vendedor que registra, estado `activo` | `apps/api/src/routes/tenderos.ts:42-65` (zona del vendedor, `vendedor_id` del cuerpo, `'activo'`) y `:76-77` (201 `{ tendero }`) | REG:36 «CA1: crea el tendero con la zona del vendedor, su id y estado activo» |
| CA2. Aparece en la lista de V-101 y no en la de V-102 | `apps/api/src/routes/tenderos.ts:63` (guarda la zona del vendedor) y `:30` (el `GET`, que ya existía, filtra por zona) | REG:44 «CA2: aparece en la lista de V-101 y no en la de V-102»; E2E:28 «CA25 y CA2…» (solo comprueba la lista de V-101) |
| CA3. La zona y el estado los fija el servidor | `apps/api/src/validaciones/tendero.ts:62-76` (`z.object` descarta las claves que no son del contrato); `apps/api/src/routes/tenderos.ts:53` y `:63` | REG:54 «CA3: ignora la zona y el estado que llegan en el cuerpo»; VAL:117 «descarta zona y estado del cuerpo (CA3)» |
| CA4. DI válido | `apps/api/src/validaciones/documento.ts:14` | REG:69 «CA4: acepta DI 999123» y «CA4: acepta DI 9991234567»; DOC:16 «acepta %s (CA4)» |
| CA5. DI inválido | `apps/api/src/validaciones/documento.ts:8`, `:14`; `apps/api/src/validaciones/tendero.ts:84-85` | REG:262 «CA5 y CA21: rechaza DI 99912 con su mensaje y no crea nada», «CA5: rechaza DI 99912345678…» y «CA5: rechaza DI 99912A…»; DOC:20 «rechaza %s (CA5)»; VAL:40 |
| CA6. RT válido | `apps/api/src/validaciones/documento.ts:15`, `:31-39` (dígito de control), `:46-49` | REG:69 «CA6: acepta RT …» (3 casos); DOC:34 «acepta %s (CA6)» |
| CA7. RT inválido | `apps/api/src/validaciones/documento.ts:15`, `:46-49` | REG:262 «CA7: rechaza RT …» (2 casos); DOC:38 «rechaza %s (CA7)»; VAL:40 |
| CA8. RT sin guion se rechaza (P11 b) | `apps/api/src/validaciones/documento.ts:15` (el formato exige el guion) | REG:262 «CA8: rechaza RT 9991234561…»; DOC:42 «rechaza el RT sin guion 9991234561 (CA8, P11 b)» |
| CA9. PA válido | `apps/api/src/validaciones/documento.ts:16` | REG:69 «CA9: acepta PA …» (2 casos); DOC:63 «acepta %s (CA9)» |
| CA10. PA inválido | `apps/api/src/validaciones/documento.ts:16`, `:27` (solo pasa a mayúsculas de la a a la z) | REG:262 «CA10: rechaza PA …» (4 casos); DOC:79 «rechaza %s (CA10)»; VAL:40 |
| CA11. PA en minúsculas se acepta y se guarda en mayúsculas (P11 b, D9) | `apps/api/src/validaciones/documento.ts:27`; `apps/api/src/validaciones/tendero.ts:92` | REG:80 «CA11: guarda PA 999abc normalizado»; DOC:67; VAL:34 |
| CA12. Normalización de espacios y puntos | `apps/api/src/validaciones/documento.ts:26`; `apps/api/src/validaciones/tendero.ts:92` | REG:80 «CA12: guarda DI 999.124.001 normalizado» y «CA12: guarda RT 999 000 024-4 normalizado»; DOC:24, DOC:46; VAL:34 |
| CA13. Duplicado en la zona → 409 y un solo tendero | `apps/api/migrations/002_tenderos_documento_unico.sql`; `apps/api/src/routes/tenderos.ts:47-73` | REG:154 «CA13: rechaza el mismo DI escrito con puntos y deja un solo tendero»; REG:193 «duplicado escrito distinto: PA en mayúsculas y luego en minúsculas (D9)» y «…: RT sin espacios y luego con espacios»; REG:205 «rechaza el documento de un tendero de test-data/ de la zona del vendedor»; MIG:25; E2E:40 «CA22 y CA13…» |
| CA14. Mismo número con otro tipo → 201 | `apps/api/migrations/002_tenderos_documento_unico.sql` (índice sobre tipo y número) | REG:88 «CA14: acepta el mismo número con otro tipo de documento»; MIG:31 |
| CA15. Duplicado en otra zona → 409 solo con el mensaje general (P4 a) | `apps/api/src/routes/tenderos.ts:71-73` | REG:163 «CA15: en otra zona responde solo el mensaje general…»; REG:205 «rechaza el documento de un tendero de test-data/ de otra zona» |
| CA16. Duplicado inactivo → mensaje de inactivo solo en la zona del vendedor (P5 c, D5) | `apps/api/src/routes/tenderos.ts:68-73` | REG:172 «CA16: un tendero inactivo de la zona del vendedor…»; REG:181 «CA16 y D5: un tendero inactivo de otra zona…» |
| CA17. Doble envío → un 201, un 409 y un solo tendero | `apps/api/migrations/002_tenderos_documento_unico.sql`; `apps/api/src/routes/tenderos.ts:47` (sin consulta previa; decide el índice) | REG:215 «CA17: si otro envío guarda el mismo documento antes del INSERT…». **Cubre la mitad del criterio:** comprueba el 409 y que queda un solo tendero, pero el «otro envío» es un `INSERT` directo en la base y no un `POST`, así que no se comprueba el 201 (ver «Riesgos»). MIG:25 |
| CA18. Campo obligatorio con solo espacios → 400 | `apps/api/src/validaciones/tendero.ts:42-43` (`trim` y `min(1)`, PT3) | REG:281 «CA18: responde 400 con el mensaje aprobado y no crea nada»; VAL:52 |
| CA19. Teléfono inválido → 400 (P2, D1) | `apps/api/src/validaciones/tendero.ts:46-51` | REG:281 «CA19: …»; VAL:68 «rechaza el teléfono %s (CA19)» |
| CA20. Correo inválido → 400 (P3 a, D1) | `apps/api/src/validaciones/tendero.ts:54-60` | REG:281 «CA20: …»; VAL:76 «rechaza un correo sin arroba (CA20)» |
| CA21. La API valida sin el formulario | `apps/api/src/routes/tenderos.ts:36-40` | REG:262 «CA5 y CA21: rechaza DI 99912 con su mensaje y no crea nada» (todas las pruebas REG llaman a la API sin el formulario) |
| CA22. Error en el formulario: mensaje de CA13 y los campos conservan lo escrito | `apps/web/src/pages/RegistrarTendero.tsx:41-44` (no reinicia el estado) y `:76` (`role="alert"`) | E2E:40 «CA22 y CA13…»: **es la única prueba con un duplicado real** (registra DI `999123456` y lo repite como `999.123.456`). RTW:78 «ante un duplicado muestra el mensaje de la API y conserva lo escrito (CA22)» simula la respuesta 409 con `fetch`: comprueba el comportamiento del formulario, no el duplicado |
| CA23. `D'Luis` se guarda idéntico | `apps/api/src/routes/tenderos.ts:50-65` (`INSERT` con parámetros); `apps/api/src/validaciones/tendero.ts:43` (solo recorta los extremos, D2) | REG:115 «CA23: guarda D'Luis idéntico»; VAL:62 |
| CA24. Vendedor inexistente → 404 y nada creado | `apps/api/src/routes/tenderos.ts:42-46` | REG:290 «CA24: responde 404 si el vendedor no existe y no crea nada» |
| CA25. Después de guardar: lista con «Tendero registrado» (P9 a) | `apps/web/src/pages/RegistrarTendero.tsx:40`; `apps/web/src/pages/Tenderos.tsx:11`, `:25`; ruta en `apps/web/src/App.tsx:40` y enlace en `Tenderos.tsx:27` (PT5) | RTW:123 «al guardar con éxito vuelve a la lista con «Tendero registrado»…»; TW:33; E2E:28 «CA25 y CA2…» |

## Evidencia de pruebas

- [x] `npm test` pasa
- [x] `npm run lint` pasa
- [x] `npm run test:e2e` pasa

Claude ejecutó los tres comandos en su entorno local el 30 de septiembre de 2026, sobre el commit `b1550f4` de la rama `hu-101-registro-tenderos`, mientras preparaba esta descripción. Antes de `npm run test:e2e` comprobó que los puertos 3001 y 5173 no respondían.

El repositorio no tiene CI, así que no hay un registro de estas ejecuciones fuera de esta descripción. Quien revisa debe volver a ejecutar los tres comandos. La salida de abajo es la completa de cada comando.

`npm test`:

```
> test
> npm test -w apps/api && npm test -w apps/web


> test
> vitest run


 RUN  v5.0.2 …/apps/api


 Test Files  7 passed (7)
      Tests  158 passed (158)
   Start at  15:58:15
   Duration  2.38s (import 50%, tests 32%, transform 16%, worker 2%)

    Isolate  7 workers spawned · ~105ms startup each (spawn + environment, per file)
             at least ~632ms faster with isolate: false — reuses workers across files instead of one per file


> test
> vitest run


 RUN  v5.0.2 …/apps/web


 Test Files  3 passed (3)
      Tests  12 passed (12)
   Start at  15:58:18
   Duration  5.15s (tests 60%, environment 24%, import 8%, transform 5%, setup 3%)

    Isolate  3 workers spawned · ~492ms startup each (spawn + environment, per file)
             at least ~984ms faster with isolate: false — reuses workers across files instead of one per file
```

(Lo único que se acortó es la ruta absoluta del directorio de trabajo en las líneas `RUN`.)

`npm run lint`: `tsc --noEmit` no imprime nada cuando no hay errores, así que la salida completa es:

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


Running 4 tests using 1 worker

  ✓  1 [chromium] › e2e/navegacion.spec.ts:3:5 › el vendedor ingresa, consulta el catálogo y ve los tenderos de su zona (1.0s)
  ✓  2 [chromium] › e2e/navegacion.spec.ts:19:5 › un código de vendedor desconocido muestra un error (435ms)
  ✓  3 [chromium] › e2e/registro-tendero.spec.ts:28:5 › CA25 y CA2: registra un tendero y vuelve a la lista con «Tendero registrado» (849ms)
  ✓  4 [chromium] › e2e/registro-tendero.spec.ts:40:5 › CA22 y CA13: un DI repetido con puntos muestra el mensaje y conserva lo escrito (1.2s)

  4 passed (6.6s)
```

Total: 170 pruebas unitarias y de integración (158 de la API y 12 de la web) y 4 de extremo a extremo, todas en verde.

**Pruebas manuales:** no se hizo ninguna.
- Los commits no registran pruebas manuales.
- Al preparar esta descripción, Claude pidió levantar la API con una base en memoria para la comprobación con `curl` del plan (paso 4). El permiso para ejecutarlo no se aprobó en la sesión y no se reintentó.
- Las tres casillas de arriba cubren solo los comandos automáticos.

Antes de pedir la revisión hay que hacer los recorridos manuales del plan (pasos 4 y 8) y anotar aquí cada caso con su resultado:
- `npm run db:reset && npm run dev`.
- `POST /api/tenderos` con los datos válidos base y DI `999124001` → 201, zona Norte, estado `activo`.
- En http://localhost:5173, entrar con `V-101`, registrar un tendero y repetir el documento con puntos.

## Capturas

Pendiente de captura. Todas con datos de `test-data/` y los datos válidos base de la historia (V-101, «Tienda Prueba Norte», DI `999124011` / `999123456`):

1. **Tenderos de la zona Norte** con el enlace nuevo «Registrar tendero».
2. **Registrar tendero** con el formulario vacío.
3. **Registrar tendero** con el error 409 «Este tendero ya está registrado.» y los campos conservando lo escrito (DI `999.123.456`).
4. **Registrar tendero** con un error 400 de la API, por ejemplo «El documento de identidad debe tener de 6 a 10 dígitos.» con DI `99912`.
5. **Tenderos de la zona Norte** después de guardar, con «Tendero registrado» y la fila «Tienda Prueba Norte».
6. **Tenderos de la zona Norte** con el error de carga en `role="alert"` (cambio de `Tenderos.tsx` en `0f999df`). Esta captura requiere provocar el error, por ejemplo deteniendo la API.

## Riesgos

**Lo que puede fallar** (se deduce del código)
- **`vendedorId` sin verificar:** llega en el cuerpo desde la sesión del cliente y la API no comprueba quién lo envía (`apps/api/src/routes/tenderos.ts:42`). Cualquier cliente que llame a la API puede registrar tenderos a nombre y en la zona de otro vendedor. La autenticación real está fuera del alcance de esta historia, pero el endpoint nuevo escribe datos, así que el riesgo es mayor que el de los `GET` que ya existían.
- **Detección del duplicado:** depende de que `node:sqlite` informe `errcode` 2067 o el texto `UNIQUE constraint failed` (`tenderos.ts:12-13`). Si cambia en otra versión de Node, un duplicado respondería 500. Las pruebas de CA13 a CA17 lo detectarían.
- **JSON mal formado en otras rutas:** el manejador de D10 (`app.ts:18-22`) solo cubre `/api/tenderos`. En `/api/sesion` y en las demás rutas, un JSON mal formado sigue cayendo en el manejador general con 500 «Error interno» (`app.ts:29-32`). Sin prueba.
- **Migración 002 sobre una base local existente:** si alguien creó a mano documentos repetidos en su base local, la migración fallaría al arrancar. La salida es `npm run db:reset`. Sin prueba.

**Lo que no se probó**
- **Concurrencia real (CA17):** `node:sqlite` es síncrono y dos `POST` en el mismo proceso nunca se intercalan.
  - La prueba simula otro envío con un `INSERT` directo justo antes del `INSERT` del endpoint. Así confirma que el endpoint depende del índice único y responde 409.
  - No comprueba el 201 del otro envío, ni dos procesos o conexiones reales.
- **CA2 de extremo a extremo:** el e2e solo comprueba la lista de V-101. Que no aparezca en la de V-102 se comprueba solo en la prueba de la API (REG:44).
- **Pruebas manuales y capturas:** pendientes (ver arriba).
- **Aislamiento del e2e:** la base en memoria se comparte entre los tests de la corrida, y `reuseExistingServer` reutiliza una API que ya esté corriendo, con su base local, si el puerto 3001 está ocupado. Por eso `npm run test:e2e` debe correr con el puerto 3001 libre.
- **Doble clic en «Guardar»:** el botón no se desactiva mientras se envía (`RegistrarTendero.tsx:75`). Si salen dos envíos, el índice deja un solo tendero y el segundo recibe 409. Qué ve el vendedor depende del orden de las respuestas: no hay prueba y es una deducción del código.
- **Falla de red:** `fetch` rechaza con el error del navegador, y `Tenderos.tsx:19` y `RegistrarTendero.tsx:43` muestran su `message` («Failed to fetch» en Chromium; el texto cambia según el navegador).
  - Por eso el texto aprobado en D11 («No se pudo cargar la lista de tenderos») solo aparecería si se lanzara algo que no es un `Error`.
  - No hay prueba de este caso.

**Comportamientos sin decidir** (`docs/planes/HU-101-pruebas.md`, «Sin decidir (sin prueba)»):
- Un número de documento que solo tiene puntos (`...`) hoy da el mensaje del DI; falta decidir si cuenta como vacío (D10).
- Un espacio no separable en el documento hoy se rechaza.
- Un texto de 100 caracteres con espacios en los extremos hoy se acepta, porque se recorta antes de medir. Tampoco está decidido cómo cuentan las tildes descompuestas.
- Las claves que no son del contrato hoy se ignoran. Falta decidir si deben rechazarse; la prueba REG:107 solo asegura que no modifican otros tenderos.

**Pendiente dentro de esta historia**
- **D7 no está cumplida en esta rama:** el equipo decidió agregar `POST /api/tenderos` a la tabla de endpoints de `docs/contexto-del-portal.md` en este mismo pull request. El archivo no cambió respecto de `main`:
  - La tabla no tiene el endpoint (el contrato, por ahora, está solo en esta descripción).
  - «Registro de tenderos» sigue como «Por construir».
  - El texto dice que la tabla `tenderos` no tiene restricción de documento repetido, lo que ya no es cierto con la migración 002.

**Fuera del alcance** (historia, «Fuera del alcance», y decisiones):
- Edición de los datos del tendero (HU-102). El esquema de teléfono y correo queda en `validaciones/tendero.ts` para reutilizarlo, pero la edición no se tocó (D8).
- Búsqueda (HU-103), detalle (HU-104), catálogo (HU-105), y pedidos, pagos y ERP (HU-106).
- Autenticación real del vendedor (su efecto en este endpoint está en «Lo que puede fallar»).
- El teléfono es obligatorio solo en los registros nuevos y en la API. La columna sigue admitiendo nulos y los tenderos de `test-data/` sin teléfono no cambian (D6).
- Los documentos que empiezan por `999` se aceptan en todos los ambientes durante el sprint 1 (P8 b).

## Uso de IA

Esta sección solo afirma lo que consta en los commits (el autor y el trailer `Co-Authored-By`) y en los archivos de decisiones. Todo lo que no consta queda indicado.

**Qué se hizo con Claude, commit por commit:**

| Commit | Contenido | Autor | Claude como coautor |
|---|---|---|---|
| `d8fed30` | Historia reescrita, respuestas del PO, plan y decisiones PT1 a PT6 y D1 a D9 | Profesor del curso | No |
| `9008079`, `6cdeed6`, `64869d8`, `caa41fa`, `eab6b5c`, `7aaee6a`, `78254cf` | Pasos 1 a 7 | Profesor del curso | Sí (Claude Opus 5.5) |
| `365f649`, `0f999df` | «Ajustes de la revisión» | Profesor del curso | Sí (Claude Opus 5.5) |
| `075b3a5` | «Corrección del profesor» (D10) | Profesor del curso | No |
| `7992a8d` | Aprobación de D11 en el archivo de decisiones | Profesor del curso | Sí (Claude Sonnet 4.6) |
| `0af0d2d`, `b1550f4` | Paso 8 (e2e) y ajustes de la revisión de pruebas, con `HU-101-pruebas.md` | Claude | — |

Tres puntos que la tabla no muestra:
- `d8fed30` no tiene trailer de Claude, así que los commits no muestran si el plan se hizo con Claude ni si se hizo en modo plan.
- Los commits `0af0d2d` y `b1550f4` los hizo Claude y no hay un commit posterior de una persona.
- Esta descripción del pull request la redactó Claude.

**Correcciones al código generado:**
- **Hecha por una persona sin Claude** (la única que consta): `075b3a5`. Cambia el texto provisional `[POR DEFINIR: D1]` por el mensaje general «Revisa los datos del tendero.» (D10) y registra D10 en las decisiones.
- **Ajustes escritos con Claude como coautor**, a partir de una revisión. Los commits no dicen quién hizo la revisión. Además, en el repositorio no hay una lista de revisión llena con «Sí / No / No aplica».
  - `365f649`:
    - El teléfono pasa a tener un máximo de 100 caracteres, y al validarlo solo se quitan espacios y guiones.
    - `normalizarDocumento` quita solo espacios y puntos, no cualquier espacio en blanco.
    - Las reglas sin mensaje aprobado pasan a usar una constante provisional.
    - Se agregaron pruebas de 101 caracteres, de tabuladores y saltos de línea, y del tipo de documento que envía el formulario.
  - `0f999df`:
    - El JSON mal formado responde 400 en lugar de 500 (punto 3.1 de `docs/lista-de-revision-codigo-generado.md`).
    - La carga de la lista de tenderos maneja el error (punto 3.3).

**Decisiones de personas y qué las respalda:**
- **P1 a P11 y los mensajes de error de la historia:** el archivo `HU-101-respuestas-del-product-owner.md` dice que son respuestas del product owner. No tiene firma ni fecha; se subió en `d8fed30`.
- **PT1 a PT6 y D1 a D9:** `HU-101-decisiones-del-equipo.md` dice que son la revisión del tech lead antes de implementar. Se subió en `d8fed30`, antes del primer commit de código (`9008079`). No hay firma ni otro registro de la aprobación aparte de ese archivo.
- **D10:** la agregó el autor de `075b3a5` («Agregada en la implementación»). El archivo no dice quién la aprobó.
- **D11:** se agregó en `7992a8d`, con Claude Sonnet 4.6 como coautor. El archivo da la fecha de aprobación (29 de septiembre de 2026) pero no dice quién la aprobó.

**Registro de la sesión:** el único commit con referencia a una sesión de Claude es `7992a8d` (trailer `Claude-Session`). Los demás commits no indican dónde está el registro. [POR DEFINIR: enlace o ubicación del registro de las sesiones de implementación.]

## Dudas

- **Pruebas manuales:** no hay registro de pruebas manuales en los commits. El permiso para levantar la API y hacer la comprobación con `curl` no se aprobó en la sesión. Falta que alguien las haga y anote los casos y los resultados.
- **Capturas:** no las generé. Hacen falta las 6 de la sección «Capturas».
- **D7:** `docs/contexto-del-portal.md` no se actualizó. Falta decidir si se agrega el endpoint en esta rama antes de abrir el pull request, como dice D7, o si se cambia la decisión.
- **CI:** el repositorio no tiene CI. Falta decidir si la evidencia de pruebas se queda como ejecución local o si se agrega un flujo que la registre.
- **Revisión humana de `0af0d2d` y `b1550f4`:** no consta. Falta confirmar si una persona los revisó y dónde queda registrado.
- **Revisión de `365f649` y `0f999df`:** no consta quién hizo la revisión que dio origen a esos ajustes.
- **Plan:** no consta si `docs/planes/HU-101-plan.md` se hizo con Claude ni en modo plan.
- **D10 y D11:** no consta quién las aprobó.
- **Registro de la sesión:** solo `7992a8d` tiene enlace. No sé dónde está el registro de las sesiones de los pasos 1 a 8.
- **Quién es «Profesor del curso»:** es el autor de los commits de los pasos 1 a 7 y de las correcciones. No sé si es el tech lead que firma las decisiones ni quién revisa este pull request; por eso la descripción habla del «autor de los commits».
- **Comentario desactualizado:** `apps/api/src/validaciones/tendero.ts:18-21` todavía dice «Se reemplaza cuando se apruebe su texto», pero D10 ya aprobó ese texto. No lo corregí porque la tarea era solo redactar la descripción.
