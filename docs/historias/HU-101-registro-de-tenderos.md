# HU-101 · Registro de tenderos (historia reescrita)

## (5) Historia reescrita

**Enunciado.** Como vendedor de Andina, quiero registrar un tendero nuevo desde el portal para poder tomarle pedidos desde la primera visita, sin esperar a que la oficina lo cargue.

**Criterios de aceptación**

**CA1. Registro válido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999123456`,
- **entonces** la API responde 201 [Propuesta] y el tendero queda guardado con zona Norte, vendedor [POR DEFINIR: P7] y estado [POR DEFINIR: P6].

**CA2. Aparece en la lista de la zona**
- **Dado** un tendero registrado por V-101 con los datos válidos base y DI `999123456`,
- **cuando** se consulta `GET /api/tenderos?vendedorId=` con el id de V-101 y con el id de V-102,
- **entonces** «Tienda Prueba Norte» aparece en la lista de V-101 y no aparece en la de V-102.

**CA3. La zona y el estado los fija el servidor**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999124005`, `zona: "Sur"` y `estado: "inactivo"`,
- **entonces** el tendero queda en la zona Norte y con el estado de CA1 [Propuesta: se ignoran los campos] [POR DEFINIR: P6].

**CA4. DI válido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999123`, y en otra prueba con DI `9991234567`,
- **entonces** la API responde 201 [Propuesta] en ambos casos.

**CA5. DI inválido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `99912`, `99912345678` o `99912A`,
- **entonces** la API responde 400 con `{ "error": "El documento de identidad debe tener de 6 a 10 dígitos." }` [Propuesta] y no se crea nada.

**CA6. RT válido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con RT `999123456-1`, `999000013-0` o `999000005-0`,
- **entonces** la API responde 201 [Propuesta].

**CA7. RT inválido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con RT `999123456-2` o `99912345-6`,
- **entonces** la API responde 400 con `{ "error": "El registro tributario no es válido." }` [Propuesta] y no se crea nada.

**CA8. RT sin guion**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con RT `9991234561`,
- **entonces** [POR DEFINIR: P11].

**CA9. PA válido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con PA `999ABC` o `999ABCDEF`,
- **entonces** la API responde 201 [Propuesta].

**CA10. PA inválido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con PA `999AB`, `999ABCDEFG`, `999ÁBC` o `999AB-C`,
- **entonces** la API responde 400 con `{ "error": "El pasaporte debe tener de 6 a 9 letras mayúsculas o dígitos." }` [Propuesta] y no se crea nada.

**CA11. PA en minúsculas**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con PA `999abc`,
- **entonces** [POR DEFINIR: P11].

**CA12. Normalización**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999.124.001`, y en otra prueba con RT `999 000 024-4`,
- **entonces** se guardan como `999124001` y `999000024-4`.

**CA13. Duplicado en la zona**
- **Dado** un tendero registrado por V-101 con DI `999123456`,
- **cuando** V-101 registra los datos válidos base con DI `999.123.456`,
- **entonces** la API responde 409 con `{ "error": "Este tendero ya está registrado." }` [Propuesta] y en la base sigue habiendo un solo tendero con DI `999123456`.

**CA14. Mismo número con otro tipo**
- **Dado** un tendero registrado por V-101 con DI `999123456`,
- **cuando** V-101 registra los datos válidos base con PA `999123456`,
- **entonces** la API responde 201 [Propuesta], porque el tipo es distinto (anexo: el tendero se identifica por tipo y número).

**CA15. Duplicado en otra zona**
- **Dado** un tendero registrado por V-101 con DI `999123456`,
- **cuando** V-102 registra los datos válidos base con DI `999123456`,
- **entonces** la API responde 409; el contenido de la respuesta es [POR DEFINIR: P4].

**CA16. Duplicado inactivo**
- **Dado** un tendero con DI `999124006` guardado con estado `inactivo` en la preparación de la prueba,
- **cuando** V-101 registra los datos válidos base con DI `999124006`,
- **entonces** [POR DEFINIR: P5].

**CA17. Doble envío**
- **Dado** el vendedor V-101,
- **cuando** se envían al mismo tiempo dos `POST /api/tenderos` [Propuesta] con los datos válidos base y DI `999124003`,
- **entonces** uno responde 201 [Propuesta], el otro 409, y en la base hay un solo tendero con ese documento.

**CA18. Campo obligatorio vacío**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999124007` y `nombreTienda: "   "`,
- **entonces** la API responde 400 con `{ "error": "El nombre de la tienda es obligatorio." }` [Propuesta] y no se crea nada. Que el nombre de la tienda sea obligatorio: [POR DEFINIR: P1]. Que un texto con solo espacios cuente como vacío: [Propuesta].

**CA19. Teléfono inválido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999124008` y `telefono: "abc"`,
- **entonces** [POR DEFINIR: P2].

**CA20. Correo inválido**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999124009` y `correo: "sin-arroba"`,
- **entonces** [POR DEFINIR: P3].

**CA21. Validación en la API**
- **Dado** el vendedor V-101,
- **cuando** llama a `POST /api/tenderos` [Propuesta] directamente, sin el formulario, con los datos válidos base y DI `99912`,
- **entonces** la respuesta es la misma de CA5.

**CA22. Error en el formulario**
- **Dado** un tendero registrado por V-101 con DI `999123456` y el formulario lleno con los datos válidos base y DI `999.123.456`,
- **cuando** el vendedor guarda,
- **entonces** ve el mensaje de CA13 y los campos conservan lo que escribió.

**CA23. Valores con comilla simple**
- **Dado** el vendedor V-101,
- **cuando** registra los datos válidos base con DI `999124004` y nombre `D'Luis`,
- **entonces** la API responde 201 [Propuesta] y el nombre se guarda como `D'Luis`.

**CA24. Vendedor inexistente**
- **Dado** que no existe un vendedor con id `9999`,
- **cuando** se registran los datos válidos base con DI `999124010` y `vendedorId: 9999`,
- **entonces** la API responde 404 con `{ "error": "Vendedor no encontrado." }` [Propuesta] y no se crea nada.

**CA25. Después de guardar**
- **Dado** el formulario lleno por V-101 con los datos válidos base y DI `999124011`,
- **cuando** guarda con éxito,
- **entonces** [POR DEFINIR: P9] [Propuesta: vuelve a la lista con el mensaje «Tendero registrado»].

**Datos de prueba**

*Condiciones de todas las pruebas (casos borde y CA)*
- Cada prueba arranca con la base en memoria cargada solo con `test-data/`, más lo que indique su «Dado».
- La sesión por defecto es V-101 (zona Norte).
- El id de cada vendedor se obtiene con `POST /api/sesion` enviando `{ codigoVendedor: "V-101" }` o `"V-102"`.

*Contrato [Propuesta]*
- Ruta: `POST /api/tenderos`.
- Campos: `vendedorId`, `tipoDocumento`, `numeroDocumento`, `nombre`, `nombreTienda`, `telefono`, `correo`, `direccion`.
- Éxito: 201.

*Datos válidos base*
- Nombre «Prueba Norte», tienda «Tienda Prueba Norte», dirección «Dirección de prueba 1».
- Teléfono `5550000001` [POR DEFINIR: P2] y correo `prueba@ejemplo.test`.

*Documentos*
- DI válidos: `999123456`, `999123`, `9991234567`, `999124001` a `999124011`.
- DI inválidos: `99912`, `99912345678`, `99912A`.
- RT válidos: `999123456-1`, `999000013-0` (residuo 10), `999000005-0` (residuo 0), `999000024-4` (suma 257, residuo 4).
- RT inválidos: `999123456-2`, `99912345-6`, `9991234561`.
- PA válidos: `999ABC`, `999ABCDEF`, `999123456`.
- PA inválidos: `999AB`, `999ABCDEFG`, `999ÁBC`, `999AB-C`, `999abc` (este último según P11).

**Fuera del alcance**
- Editar los datos del tendero (HU-102).
- Buscar tenderos (HU-103).
- Pantalla de detalle (HU-104).
- Catálogo (HU-105).
- Pedidos, pagos y conexión con el ERP (HU-106).
- Autenticación real del vendedor.

## (4) Preguntas para el product owner

**P1. ¿Qué campos son obligatorios y con qué longitud máxima?**
- Opciones: (a) todos obligatorios; (b) todos obligatorios menos el correo; (c) obligatorios solo el documento, el nombre y el nombre de la tienda.
- Qué cambia: el esquema zod, las columnas `NOT NULL` de la migración y las marcas del formulario. [Propuesta] Opción (b), con un máximo de 100 caracteres por campo de texto.

**P2. ¿Qué formato debe tener el teléfono?**
- Opciones: (a) solo dígitos, con una longitud mínima y máxima que usted defina; (b) texto libre; (c) la misma regla que se defina para HU-102.
- Qué cambia: la regla zod de `telefono` y si se normalizan espacios y guiones, como en el documento.

**P3. ¿Se valida el formato del correo y es opcional?**
- Opciones: (a) opcional, pero si se escribe debe tener forma de correo; (b) obligatorio y con formato válido; (c) sin validación.
- Qué cambia: la regla zod de `correo` y si la columna admite nulos.

**P4. Si el documento ya existe en otra zona, ¿qué ve el vendedor?**
- Opciones: (a) solo «Este tendero ya está registrado», sin datos de la otra zona; (b) el mensaje más la zona del tendero existente; (c) el mensaje más un aviso a la oficina.
- Qué cambia: el cuerpo de la respuesta 409 y, en la opción (c), una integración que hoy no existe. Las opciones (b) y (c) muestran datos de una zona que el vendedor no puede ver, lo que entra en tensión con la regla 1 del contexto.

**P5. Si el documento pertenece a un tendero inactivo, ¿qué pasa?**
- Opciones: (a) se rechaza igual que un duplicado; (b) se reactiva el tendero existente; (c) se rechaza con un mensaje distinto que indique que está inactivo.
- Qué cambia: la opción (b) convierte el registro en una actualización y roza el alcance de HU-102.

**P6. ¿Con qué estado queda el tendero recién registrado?**
- Opciones: (a) `activo`; (b) `inactivo` hasta que la oficina lo revise; (c) un estado nuevo de revisión.
- Qué cambia: el valor por defecto. La opción (c) exige cambiar el modelo y la migración, y la (b) impide tomar pedidos en la primera visita, que es el objetivo de la historia.

**P7. ¿Qué vendedor queda asignado al tendero?**
- Opciones: (a) el que lo registra; (b) otro vendedor de la misma zona.
- Qué cambia: si `vendedorId` lo fija el servidor desde la sesión o si el formulario necesita un selector. [Propuesta] Opción (a).

**P8. ¿Se aceptan documentos que empiezan por `999` fuera del ambiente de pruebas?**
- Opciones: (a) se rechazan en producción; (b) se aceptan en todos los ambientes.
- Qué cambia: la opción (a) requiere una configuración por ambiente en el validador.

**P9. ¿Qué ve el vendedor al guardar con éxito?**
- Opciones: (a) vuelve a la lista con el mensaje «Tendero registrado»; (b) se queda en un formulario vacío para registrar otro; (c) pasa al detalle del tendero.
- Qué cambia: la navegación. La opción (c) depende de HU-104, que está fuera del alcance. [Propuesta] Opción (a).

**P10. ¿El formato de papel trae datos que no están en la lista de la historia?**
- Opciones: (a) no, son solo esos seis más el tipo de documento; (b) sí, y hay que incluirlos.
- Qué cambia: el formulario, el endpoint y la migración.

**P11. ¿Se aplica alguna normalización además de quitar espacios y puntos?**
- Opciones: (a) ninguna, se aplica el anexo tal cual; (b) convertir el PA a mayúsculas; (c) aceptar el RT sin guion y agregarlo.
- Qué cambia: el paso de normalización del validador y los resultados de CA8 y CA11.
