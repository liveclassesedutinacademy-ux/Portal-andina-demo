# HU-102 · Tabla criterio–prueba

Relación entre los criterios de aceptación de HU-102 y las pruebas que los comprueban, leída de las pruebas reales. Nodo Software y Distribuidora Andina son empresas ficticias; los datos de las pruebas salen de `test-data/` o son valores inventados de la historia.

Archivos:
- **T**: `apps/api/test/tenderos.test.ts`, bloque `PUT /api/tenderos/:id`.
- **V**: `apps/api/test/validacion-tendero.test.ts`, bloque `esquemaEdicionTendero`.
- **W**: `apps/web/test/EditarTendero.test.tsx`.
- **L**: `apps/web/test/Tenderos.test.tsx`.

| Criterio | Archivo · prueba | Estado |
|---|---|---|
| CA1 Abrir la edición | W · «carga los datos del tendero en el formulario», «cada campo muestra el valor que devuelve GET (CA1)», «solo los 5 campos de P1 c son editables (CA1)» | Cubierto |
| CA2 Teléfono válido | T · «guarda un teléfono válido (CA2)»; V · «acepta el teléfono %s y lo entrega como se escribió (CA2, CA6)» | Cubierto |
| CA3 Agregar correo | T · «agrega un correo al tendero 3 (CA3)» | Cubierto |
| CA4 Teléfono inválido | T · «rechaza un teléfono con letras y no cambia el tendero (CA4, CA13)»; V · «un teléfono con letras produce el mensaje de CA4» | API cubierta. Formulario **sin prueba** (pendiente, paso 5) |
| CA5 Correo inválido | T · «rechaza un correo inválido con el mismo cuerpo que el formulario (CA5, CA13)»; V · «rechaza el correo %s (CA5)» | API cubierta. Formulario **sin prueba** (pendiente, paso 5) |
| CA6 Separadores y longitud | T · «guarda 555 123 4567 como se escribió (CA6)», «rechaza el teléfono %s y no lo cambia (CA6)»; V · «acepta el teléfono %s …», «rechaza el teléfono %s por su longitud (CA6)» | Cubierto |
| CA7 Campos vacíos | T · «el teléfono vacío del tendero 4 es obligatorio (CA7)», «un correo vacío borra el correo guardado (CA7)»; V · «el teléfono %j es obligatorio (CA7, P4 b)», «el correo %j queda nulo (CA7, P4 b)» | Cubierto |
| CA8 Normalización | T y V · «quita los espacios de los extremos del correo y conserva las mayúsculas (CA8…)» | Cubierto según P5 (`Tendero3@Ejemplo.TEST`) |
| CA9 Otra zona | T · «no edita un tendero de otra zona (CA9)», «no edita un tendero activo de otra zona aunque el cuerpo sea válido (CA9)», «un tendero inactivo de otra zona responde 403» | Cubierto |
| CA10 Id 9999 | T · «responde 404 con el id 9999 (CA10)» | Cubierto |
| CA11 Id `abc` | T · «responde 400 con el id abc (CA11)» | Cubierto |
| CA12 Campos no permitidos | T · «rechaza un cuerpo con solo zona y estado (CA12)», «rechaza un cuerpo válido con zona, estado y documento, y no cambia nada (CA12)»; V · «rechaza un cuerpo con solo zona y estado (CA12)», «rechaza el campo no editable %s aunque el resto sea válido (CA12, P1 c)» | Cubierto |
| CA13 Validación en la API | T · pruebas de CA4 y CA5 (cuerpo exacto con Supertest) | Cubierto |
| CA14 `D'Luis` | T · «guarda exactamente el nombre D'Luis (CA14)» | Cubierto |
| CA15, CA19, CA20 Documento | T · «el documento no se edita: %s responde 400 y el documento no cambia» | Cubierto en la versión «el documento no se edita» (decisiones del equipo); la historia está pendiente de corregir |
| CA16 Tendero inactivo | T · «no edita un tendero inactivo de la zona (CA16)» | API cubierta. Formulario **sin prueba** (pendiente, paso 5) |
| CA17 Sin cambios | T · «guardar sin cambios responde 200 y deja los datos iguales (CA17)» | Cubierto |
| CA18 Se ve en la lista | L · «muestra «Datos actualizados» y el teléfono nuevo al volver de la edición (CA18)» | Lista cubierta. Navegación desde la edición y e2e **sin prueba** (pendiente, pasos 5 y 7) |

## Mutaciones manuales

| Mutación | Pruebas que fallan | Resultado |
|---|---|---|
| Sin control de zona (`routes/tenderos.ts`) | Las tres pruebas de CA9; la de cuerpo válido falla con 200 en lugar de 403 | Detectada por el motivo correcto |
| Sin control de estado inactivo | «no edita un tendero inactivo de la zona (CA16)» (200 en lugar de 409) | Detectada |
| Teléfono sin la regla «solo números» | CA4 en T y en V (cambia el mensaje) | Detectada |
| Teléfono de edición sin ninguna validación | 10 pruebas de CA4, CA6, CA7 y máximo de 100 caracteres en T y V | Detectada |

## Pendientes

- CA4, CA5 y CA16 en el formulario y la navegación de CA18 necesitan implementar los pasos 4, 5 y 7 del plan (validación en el formulario, `vendedorId`, vuelta a la lista, bloqueo del inactivo y e2e). Las pruebas se escriben con esos pasos.
