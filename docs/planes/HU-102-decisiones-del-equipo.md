# HU-102 · Decisiones del equipo sobre el plan

Revisión del plan de HU-102 por el tech lead de Nodo Software antes de implementar. Estas decisiones cierran los puntos que un plan de esta historia suele dejar [POR DEFINIR]. Están organizadas por tema: busca el tema de cada punto pendiente de tu plan. Nodo Software y Distribuidora Andina son empresas ficticias.

## Código que ya existe

| Tema | Decisión |
|---|---|
| Validación de teléfono y correo | HU-101 ya dejó las reglas de teléfono y correo en `apps/api/src/validaciones/tendero.ts` para reutilizarlas en esta historia (HU-101, D8). El esquema de la edición va en ese mismo módulo y reutiliza esas reglas; no se crea otro módulo de validación ni se copian las reglas. Las pruebas nuevas se agregan a los archivos de prueba que ya existen cuando el tema es el mismo. |
| Mensajes | Los mensajes aprobados en HU-101 valen para la edición: teléfono vacío → «El teléfono es obligatorio.»; teléfono inválido → «El teléfono debe tener de 7 a 10 dígitos.»; correo inválido → «El correo no es válido.»; más de 100 caracteres → «Cada campo admite máximo 100 caracteres.»; nombre vacío → «El nombre del tendero es obligatorio.»; dirección vacía → «La dirección es obligatoria.». Los mensajes propios de HU-102 son los de la historia, aprobados por el product owner. |
| Datos sin mensaje aprobado | Un campo que no se puede editar (documento, zona, estado, vendedor), un campo que no es texto, un cuerpo que no es un objeto o un JSON mal formado → 400 con «Revisa los datos del tendero.» (HU-101, D10). |

## Reglas de la edición

| Tema | Decisión |
|---|---|
| Campos vacíos | El nombre del tendero, el nombre de la tienda y la dirección son obligatorios, igual que en el registro. Un texto con solo espacios cuenta como vacío. |
| Teléfono «tal como lo escribió» | Se guarda sin los espacios de los extremos y con sus espacios y guiones interiores: `555 123 4567` se guarda como `555 123 4567`. |
| Cuerpo de la petición | El `PUT` exige los 5 campos editables. No hay edición parcial en esta historia. |
| Documento en el cuerpo | Los criterios que esperan editar el documento se leen como «el documento no se edita»: un cuerpo con `tipoDocumento` o `numeroDocumento` responde 400 con «Revisa los datos del tendero.» y el tendero no cambia. El product owner corrige la historia aparte. |

## Vendedor, zona y estado

| Tema | Decisión |
|---|---|
| Identidad del vendedor | Llega como `?vendedorId=` en la consulta, igual que en la lista de tenderos. Si falta, no es un número o no existe → 400 con «Falta el vendedor.». La protección real llega con el ingreso con contraseña, fuera de este sprint. |
| Orden de las comprobaciones | Id del tendero (400) → vendedor (400) → el tendero existe (404) → zona (403) → estado inactivo (409) → cuerpo (400). Un tendero inactivo de otra zona responde 403. |
| Pruebas del tendero inactivo | El tendero inactivo se crea en la preparación de cada prueba, con valores inventados e `INSERT` con parámetros; no se agrega a `test-data/`. |

## Fuera de esta etapa

| Tema | Decisión |
|---|---|
| Formulario | Cómo se ve un tendero inactivo en el formulario, si el documento y la zona se muestran como solo lectura y el mensaje «Datos actualizados» en la lista se implementan en la etapa del formulario, no en la del endpoint. |
| Documentación del endpoint | El endpoint se agrega a la tabla de endpoints de `docs/contexto-del-portal.md` en el mismo pull request (HU-101, D7). |
