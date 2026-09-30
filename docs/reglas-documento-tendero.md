# Reglas del documento del tendero

Anexo de Distribuidora Andina (empresa ficticia) para el registro de tenderos. [Propuesta] Estas reglas son la propuesta de Andina para el sprint 1; no corresponden a la regulación de un país en particular.

## Tipos de documento

| Tipo | Nombre | Cuándo se usa | Formato válido |
|---|---|---|---|
| DI | Documento de identidad | Tendero que es persona natural | Solo dígitos, de 6 a 10. |
| RT | Registro tributario | Tendero que opera como empresa | 9 dígitos, un guion y 1 dígito de control: `NNNNNNNNN-D`. El dígito de control debe ser el que da el cálculo de abajo. |
| PA | Pasaporte | Tendero extranjero | De 6 a 9 caracteres, solo letras mayúsculas sin tilde (A–Z) y dígitos. |

## Cálculo del dígito de control del RT

1. Toma los 9 dígitos de la base, sin el guion ni el dígito de control.
2. Multiplica cada dígito por un peso. Empieza por el último dígito (el de la derecha) con peso 2 y sube de uno en uno hacia la izquierda: 2, 3, 4, 5, 6, 7, 8, 9 y 10.
3. Suma los productos.
4. Calcula el residuo de dividir la suma entre 11.
5. Si el residuo es 10, el dígito de control es 0. En cualquier otro caso, el dígito de control es el residuo.

**Ejemplo.** Base `999123456`.

| Dígito (de derecha a izquierda) | 6 | 5 | 4 | 3 | 2 | 1 | 9 | 9 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Peso | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| Producto | 12 | 15 | 16 | 15 | 12 | 7 | 72 | 81 | 90 |

Suma: 320. Residuo de 320 entre 11: 1. RT válido: `999123456-1`. Con cualquier otro dígito de control, el RT no es válido.

## Otras reglas

- Un tendero se identifica por su tipo y número de documento.
- El vendedor puede escribir el número con espacios o puntos; el portal los quita antes de validar.
- Los documentos que empiezan por `999` están reservados para datos de prueba.
