# HU-101 · Decisiones del equipo sobre el plan

Revisión del plan `docs/planes/HU-101-plan.md` por el tech lead de Nodo Software antes de implementar. Estas decisiones cierran las propuestas técnicas (PT) y las dudas (D) que el plan dejó marcadas [POR DEFINIR]. Nodo Software y Distribuidora Andina son empresas ficticias.

## Propuestas técnicas

| Id | Decisión |
|---|---|
| PT1 | Aprobada: `POST /api/tenderos` con los campos propuestos; responde 201 con `{ tendero }`. |
| PT2 | Aprobada: `zona` y `estado` que lleguen en el cuerpo se ignoran. |
| PT3 | Aprobada: un texto con solo espacios cuenta como vacío. |
| PT4 | Aprobada: primero se valida el cuerpo (400) y después se busca el vendedor (404). |
| PT5 | Aprobada: ruta web `/tenderos/nuevo` y enlace «Registrar tendero» en la lista de tenderos. |
| PT6 | Aprobada: el formulario valida campos obligatorios y longitud máxima; las reglas de documento, teléfono y correo las valida la API y el formulario muestra su mensaje. |

## Dudas

| Id | Decisión |
|---|---|
| D1 | Mensajes: tipo de documento ausente o inválido → «Elige el tipo de documento: DI, RT o PA.»; nombre vacío → «El nombre del tendero es obligatorio.»; dirección vacía → «La dirección es obligatoria.»; teléfono vacío → «El teléfono es obligatorio.»; teléfono inválido → «El teléfono debe tener de 7 a 10 dígitos.»; correo inválido → «El correo no es válido.»; más de 100 caracteres → «Cada campo admite máximo 100 caracteres.»; `vendedorId` ausente o inválido → «Falta el vendedor.» |
| D2 | Los textos se guardan sin los espacios de los extremos; el interior se guarda idéntico (`D'Luis`). |
| D3 | Si fallan varios campos, se devuelve el mensaje del primero en el orden del formulario: tipo de documento, número, nombre, nombre de la tienda, teléfono, correo, dirección. |
| D4 | Un correo vacío o con solo espacios cuenta como no escrito y se guarda como nulo. |
| D5 | El mensaje de «inactivo» solo se da si el tendero inactivo es de la zona del vendedor. Si es de otra zona, se responde el mensaje general de P4: «Este tendero ya está registrado.» |
| D6 | El teléfono es obligatorio solo para los registros nuevos, en la API. No se cambian la columna ni los datos de `test-data/`. |
| D7 | No hay contrato OpenAPI en este repositorio: el endpoint nuevo se agrega a la tabla de endpoints de `docs/contexto-del-portal.md` en el mismo pull request. |
| D8 | De acuerdo: el esquema de teléfono y correo queda en `validaciones/tendero.ts` para reutilizarlo en HU-102, sin tocar la edición en esta historia. |
| D9 | El PA se guarda en mayúsculas. |
| D10 | Agregada en la implementación: cuando un dato llega con un tipo o una forma que no tiene mensaje aprobado (número de documento vacío, un campo que no es texto, un cuerpo que no es un objeto), la API responde 400 con «Revisa los datos del tendero.» |
