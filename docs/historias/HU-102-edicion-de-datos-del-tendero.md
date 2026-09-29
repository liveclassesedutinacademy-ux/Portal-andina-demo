# HU-102 · Edición de datos del tendero (historia reescrita)

## (5) Historia reescrita

**HU-102 · Edición de datos del tendero**

**Como** vendedor de Andina, **quiero** corregir los datos de un tendero de mi zona [POR DEFINIR: P10] **para** que la información de contacto esté al día cuando lo visito o lo llamo. Los campos editables son [POR DEFINIR: P1].

**Criterios de aceptación**

**CA1. Abrir la edición.**
- **Dado** que `V-101` inició sesión y ve la lista de su zona,
- **cuando** elige editar «Tienda La Esquina»,
- **entonces** cada campo del formulario muestra el mismo valor que devuelve `GET /api/tenderos/:id` para ese tendero [Propuesta], y solo se pueden modificar los campos editables [POR DEFINIR: P1].

**CA2. Guardar un teléfono válido.**
- **Dado** que `V-101` inició sesión,
- **cuando** cambia el teléfono de «Tienda La Esquina» a `5559876543` y guarda,
- **entonces** la API responde 200 [Propuesta] y `GET /api/tenderos/:id` devuelve el teléfono `5559876543`. Formato: [POR DEFINIR: P3].

**CA3. Agregar un correo.**
- **Dado** el tendero 3, que no tiene correo, y el vendedor de su zona en `test-data/`,
- **cuando** ese vendedor escribe `tendero3@ejemplo.test` y guarda,
- **entonces** la API responde 200 [Propuesta] y el correo queda `tendero3@ejemplo.test` en la base.

**CA4. Rechazar un teléfono inválido.**
- **Dado** que `V-101` edita «Tienda La Esquina» en el formulario,
- **cuando** escribe `555-ABC-1234` y guarda,
- **entonces** [POR DEFINIR: P3]. Con P3 a) o b): la API responde 400 con `{ "error": "El teléfono solo puede tener números." }` [Propuesta], el teléfono sigue igual al que devolvía `GET` antes del intento, y el formulario muestra el mensaje y conserva lo escrito.

**CA5. Rechazar un correo inválido.**
- **Dado** que `V-101` edita «Tienda La Esquina» en el formulario,
- **cuando** escribe `esquina.ejemplo.test` y guarda,
- **entonces** [POR DEFINIR: P9]. Con la regla [Propuesta] de P9: la API responde 400 con `{ "error": "El correo no es válido." }` [Propuesta], el correo sigue igual al que devolvía `GET` antes del intento, y el formulario conserva lo escrito.

**CA6. Teléfono con separadores o fuera de longitud.**
- **Dado** un tendero de la zona,
- **cuando** el vendedor escribe `555 123 4567`, o `555`, o `5551234567890123`,
- **entonces** [POR DEFINIR: P3].

**CA7. Campos vacíos.**
- **Dado** el tendero 4, que no tiene teléfono, o «Tienda La Esquina» con el correo `esquina@ejemplo.test` guardado previamente,
- **cuando** el vendedor de su zona guarda con el teléfono o el correo vacío,
- **entonces** [POR DEFINIR: P4].

**CA8. Normalización del texto.**
- **Dado** el tendero 3,
- **cuando** el vendedor escribe ` Tendero3@Ejemplo.TEST ` y guarda,
- **entonces** [POR DEFINIR: P5] ([Propuesta] se guarda `tendero3@ejemplo.test`).

**CA9. No editar otra zona.**
- **Dado** que `V-101` (Norte) está en sesión,
- **cuando** se llama directamente al endpoint de edición sobre «Minimercado Los Pinos» (Sur) con el teléfono `5551112222`,
- **entonces** [POR DEFINIR: P10]. Con P10 a): la API responde 403 [Propuesta] con `{ "error": "Este tendero no es de tu zona." }` [Propuesta], y `GET` devuelve el tendero igual que antes de la petición.

**CA10. Tendero inexistente.**
- **Dado** el id 9999,
- **cuando** se envía una edición,
- **entonces** la API responde 404 con `{ "error": "No encontramos este tendero." }` [Propuesta].

**CA11. Id no numérico.**
- **Dado** el id `abc`,
- **cuando** se envía una edición,
- **entonces** la API responde 400 con `{ "error": "El id del tendero debe ser un número." }` [Propuesta].

**CA12. Campos no permitidos.**
- **Dado** «Tienda La Esquina» (zona Norte),
- **cuando** se envía a la API `{ "zona": "Sur", "estado": "inactivo" }`,
- **entonces** la API responde 400 [Propuesta], la zona sigue `Norte` y el estado sigue igual al que devolvía `GET` antes de la petición. Qué campos quedan protegidos: [POR DEFINIR: P1].

**CA13. Validación en la API.**
- **Dado** el correo inválido de CA5,
- **cuando** se envía con `curl` o Supertest sin pasar por el formulario,
- **entonces** la respuesta es la misma de CA5: mismo código y mismo cuerpo.

**CA14. Texto con comilla simple.**
- **Dado** que `V-101` edita «Tienda La Esquina»,
- **cuando** escribe el nombre `D'Luis` y guarda,
- **entonces** se guarda exactamente `D'Luis` y no hay error. [POR DEFINIR: P1] (aplica solo si el nombre es editable.)

**CA15. Documento RT con dígito de control incorrecto.**
- **Dado** que `V-101` edita «Tienda La Esquina» y el documento es editable [POR DEFINIR: P1, P2],
- **cuando** envía `RT 999123456-2`,
- **entonces** la API responde 400 con `{ "error": "El registro tributario no es válido." }` [Propuesta] y el documento no cambia en la base.

**CA16. Tendero inactivo.**
- **Dado** un tendero de la zona Norte con estado `inactivo` ([Propuesta] se agrega a `test-data/` si no existe),
- **cuando** `V-101` intenta editarlo,
- **entonces** [POR DEFINIR: P6].

**CA17. Guardar sin cambios.**
- **Dado** «Tienda La Esquina»,
- **cuando** el vendedor abre la edición y guarda sin cambiar nada,
- **entonces** la API responde 200 y los datos quedan iguales [Propuesta].

**CA18. El cambio se ve en la lista.**
- **Dado** que `V-101` guardó el teléfono de CA2,
- **cuando** vuelve a la lista de tenderos,
- **entonces** [POR DEFINIR: P7].

**CA19. Documento duplicado.**
- **Dado** que `V-101` edita «Tienda La Esquina» y el documento es editable [POR DEFINIR: P1, P2],
- **cuando** envía el tipo y número de documento de «Minimercado El Roble»,
- **entonces** la API responde 409 [Propuesta] con `{ "error": "Ya existe un tendero con ese documento." }` [Propuesta] y el documento no cambia en la base.

**CA20. Documento RT válido.**
- **Dado** que `V-101` edita «Tienda La Esquina» y el documento es editable [POR DEFINIR: P1, P2],
- **cuando** envía `RT 999123456-1`,
- **entonces** la API responde 200 [Propuesta] y `GET` devuelve ese documento.

**Datos de prueba**
- Vendedores: `V-101` (Norte), `V-102` (Sur), `V-103` (Centro).
- Tenderos: «Tienda La Esquina» y «Minimercado El Roble» (Norte), «Minimercado Los Pinos» (Sur), tendero 3 (sin correo), tendero 4 (sin teléfono), id 9999 (no existe), id `abc`. [Propuesta] Un tendero inactivo de la zona Norte.
- Teléfonos inventados: `5559876543`, `5551112222`, `555 123 4567`, `555-ABC-1234`, `555`, `5551234567890123`.
- Correos inventados: `tendero3@ejemplo.test`, `esquina@ejemplo.test`, `esquina.ejemplo.test`, `tendero3.ejemplo.test`, ` Tendero3@Ejemplo.TEST `.
- Documentos: `RT 999123456-1` (válido según el anexo), `RT 999123456-2` (inválido) y el documento de «Minimercado El Roble».

**Fuera del alcance**
- Registro de tenderos nuevos (HU-101).
- Búsqueda por nombre de tienda (HU-103).
- Pantalla de detalle (HU-104).
- Catálogo (HU-105).
- Pedidos y pagos (HU-106).
- Ingreso con contraseña y conexión con el ERP.
- Historial de quién cambió qué.
- Cambiar zona, vendedor asignado o estado, salvo que P1 diga lo contrario.

## (4) Preguntas para el product owner

**P1. ¿Qué campos puede editar el vendedor?**
- a) Solo teléfono y correo. *Qué cambia:* el esquema acepta solo `telefono` y `correo`; el resto se muestra como solo lectura; CA14 no aplica.
- b) Datos de contacto: teléfono, correo y dirección. *Qué cambia:* se agrega `direccion` al esquema y al formulario.
- c) Además, nombre del tendero y nombre de la tienda. *Qué cambia:* se agregan esos dos campos; CA14 aplica.
- d) También documento, zona, vendedor o estado. *Qué cambia:* activa P2; editar la zona o el vendedor cruza con P10; CA12 debe usar otros campos protegidos.

**P2. (Solo si P1 incluye el documento) ¿Se puede cambiar el tipo o el número de documento?**
- a) No.
- b) Sí, con las reglas del anexo y sin permitir duplicados.

*Qué cambia:* con b) se reutiliza el validador de HU-101, hay que limpiar espacios y puntos, se responde 409 [Propuesta] ante un duplicado y probablemente se necesita una migración con índice único sobre tipo y número.

**P3. ¿Qué formato tiene un teléfono válido?**
- a) Solo dígitos, con una longitud mínima y máxima que usted defina. [Propuesta] de 7 a 10 dígitos. *Qué cambia:* regla zod de solo dígitos con mínimo y máximo; `555 123 4567` y `555-ABC-1234` responden 400.
- b) Se aceptan espacios, puntos y guiones, pero se guardan solo los dígitos (como hace el anexo con el documento). *Qué cambia:* se quitan los separadores antes de validar; `555 123 4567` se guarda como `5551234567`; `555-ABC-1234` responde 400.
- c) Se guarda tal como se escribe. *Qué cambia:* no hay regla de formato; `555-ABC-1234` se guarda; CA4 deja de aplicar.

**P4. ¿El teléfono y el correo son obligatorios?**
- a) Los dos son obligatorios. *Qué cambia:* los dos son requeridos en zod; vacío responde 400; los tenderos 3 y 4 no se pueden guardar sin completar el dato que les falta.
- b) El teléfono es obligatorio y el correo es opcional. *Qué cambia:* el teléfono vacío responde 400; el correo vacío se guarda como `NULL`.
- c) Los dos son opcionales y se pueden borrar. *Qué cambia:* los dos son `nullable`; vaciar cualquiera guarda `NULL`.

**P5. ¿Qué significa «bien escritos»?**
- a) Solo validar teléfono y correo. *Qué cambia:* no hay normalización; ` Tendero3@Ejemplo.TEST ` se valida tal cual.
- b) Además, quitar espacios al inicio y al final de todos los campos y pasar el correo a minúsculas. *Qué cambia:* transformaciones en zod; ese correo se guarda como `tendero3@ejemplo.test`.
- c) Además, longitudes máximas por campo (valores a definir). *Qué cambia:* además de b), un máximo por campo; si se excede, responde 400.

**P6. ¿Se puede editar un tendero inactivo?**
- a) Sí, igual que uno activo.
- b) No. La API lo rechaza y el formulario no deja entrar.

*Qué cambia:* con b) hay un control de estado en el endpoint y en la interfaz, y un código de error nuevo.

**P7. ¿Cómo se comprueba que el cambio «se ve en la lista»?**
- a) La lista ya muestra teléfono y correo; basta con volver a ella.
- b) La lista no los muestra y se agregan columnas.
- c) Basta con ver el cambio al volver a abrir la edición del tendero.

*Qué cambia:* con b) se toca la pantalla de lista, que hoy no forma parte de la historia. Con a) y c) no.

**P8. ¿Aprueba los textos de los mensajes de error [Propuesta] de los criterios CA4, CA5, CA9, CA10, CA11, CA15 y CA19?**
- a) Sí.
- b) Los cambia usted.

*Qué cambia:* solo los textos en la API y las pruebas que los comparan.

**P9. ¿Qué es un correo válido?**
- a) [Propuesta] Texto sin espacios, con una sola arroba y un dominio que tenga al menos un punto (la validación de correo de zod). *Qué cambia:* se usa la regla de correo de zod; `tendero3.ejemplo.test` responde 400.
- b) Otra regla que usted defina. *Qué cambia:* se escribe una regla propia y se ajustan CA5 y CA13.

**P10. ¿El vendedor puede editar tenderos de otra zona?**
- a) No. La API rechaza la edición y el tendero no cambia. *Qué cambia:* el endpoint compara la zona del vendedor con la del tendero y responde 403 [Propuesta].
- b) Sí. *Qué cambia:* no hay control de zona; CA9 deja de aplicar.
