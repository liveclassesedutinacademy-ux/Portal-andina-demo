# HU-102 · Respuestas del product owner

Respuestas del product owner de Distribuidora Andina (empresa ficticia) a las preguntas P1 a P10 de la historia reescrita. Son coherentes con las respuestas que dio para la historia de registro (HU-101).

| Pregunta | Respuesta |
|---|---|
| P1. Campos editables | Opción (c): nombre del tendero, nombre de la tienda, teléfono, correo y dirección. El documento, la zona, el vendedor y el estado no se editan. |
| P2. Documento | No aplica: el documento no se edita. |
| P3. Formato del teléfono | Se quitan espacios y guiones; lo que queda deben ser solo dígitos, de 7 a 10. Se guarda tal como lo escribió el vendedor. Es la misma regla del registro. |
| P4. Obligatorios | Opción (b): el teléfono es obligatorio; el correo es opcional y se puede borrar (se guarda vacío como nulo). |
| P5. «Bien escritos» | Se quitan los espacios del inicio y del final de todos los campos y cada campo admite máximo 100 caracteres. El correo no se cambia a minúsculas. |
| P6. Tendero inactivo | Opción (b): no se puede editar. La API responde 409 con «Este tendero está inactivo y no se puede editar.» |
| P7. «Se ve en la lista» | Al guardar, el vendedor vuelve a la lista de tenderos con el mensaje «Datos actualizados». El teléfono se ve en la lista; el correo se comprueba al volver a abrir la edición. No se agregan columnas a la lista. |
| P8. Mensajes | Opción (a): aprobados tal como están. |
| P9. Correo válido | Opción (a): texto sin espacios, con una arroba y un dominio con punto. Es la misma regla del registro. |
| P10. Otra zona | Opción (a): no. La API responde 403 con el mensaje propuesto y el tendero no cambia. |

El tendero inactivo que piden las pruebas se crea en la preparación de cada prueba; no se agrega a `test-data/`.
