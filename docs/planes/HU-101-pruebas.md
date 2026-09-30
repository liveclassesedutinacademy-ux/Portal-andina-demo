# HU-101 · Tabla criterio–prueba

Armada leyendo las pruebas del código, no copiando la tabla del plan (`docs/planes/HU-101-plan.md`). Refleja el estado después de la revisión de pruebas.

Archivos:
- **RT**: `apps/api/test/registro-tendero.test.ts`
- **DOC**: `apps/api/test/documento.test.ts`
- **VAL**: `apps/api/test/validacion-tendero.test.ts`
- **MIG**: `apps/api/test/migraciones.test.ts`
- **RTW**: `apps/web/test/RegistrarTendero.test.tsx`
- **TW**: `apps/web/test/Tenderos.test.tsx`
- **E2E**: `e2e/registro-tendero.spec.ts`

| CA | Pruebas |
|---|---|
| CA1 | RT «CA1: crea el tendero con la zona del vendedor, su id y estado activo» |
| CA2 | RT «CA2: aparece en la lista de V-101 y no en la de V-102»; E2E «CA25 y CA2…» (solo la parte de V-101) |
| CA3 | RT «CA3: ignora la zona y el estado que llegan en el cuerpo»; VAL «descarta zona y estado del cuerpo (CA3)» |
| CA4 | RT «CA4: acepta DI 999123» y «…9991234567»; DOC «acepta %s (CA4)» |
| CA5 | RT «CA5 y CA21: rechaza DI 99912…», «CA5: rechaza DI 99912345678 / 99912A…»; DOC «rechaza %s (CA5)»; VAL «rechaza el documento con el mensaje de su tipo (CA5, CA7, CA10)» |
| CA6 | RT «CA6: acepta RT …» (3 casos); DOC «acepta %s (CA6)» |
| CA7 | RT «CA7: rechaza RT …» (2 casos); DOC «rechaza %s (CA7)»; VAL (la misma de CA5) |
| CA8 | RT «CA8: rechaza RT 9991234561…»; DOC «rechaza el RT sin guion 9991234561 (CA8, P11 b)» |
| CA9 | RT «CA9: acepta PA …» (2 casos); DOC «acepta %s (CA9)» |
| CA10 | RT «CA10: rechaza PA …» (4 casos); DOC «rechaza %s (CA10)»; VAL (la misma de CA5) |
| CA11 | RT «CA11: guarda PA 999abc normalizado»; DOC «pasa a mayúsculas: 999abc → 999ABC (CA11, P11 b)»; VAL «entrega el documento normalizado (CA12, CA11)» |
| CA12 | RT «CA12: guarda DI 999.124.001 / RT 999 000 024-4 normalizado»; DOC «quita los puntos… (CA12)», «quita los espacios… (CA12)»; VAL «entrega el documento normalizado (CA12, CA11)» |
| CA13 | RT «CA13: rechaza el mismo DI escrito con puntos y deja un solo tendero», «duplicado escrito distinto: PA… / RT…», «rechaza el documento de un tendero de test-data/ de la zona del vendedor»; MIG «impide repetir tipo y número de documento (CA13, CA17)»; E2E «CA22 y CA13…» |
| CA14 | RT «CA14: acepta el mismo número con otro tipo de documento»; MIG «admite el mismo número con otro tipo (CA14)» |
| CA15 | RT «CA15: en otra zona responde solo el mensaje general, sin datos de la otra zona», «rechaza el documento de un tendero de test-data/ de otra zona» |
| CA16 | RT «CA16: un tendero inactivo de la zona del vendedor responde el mensaje de inactivo», «CA16 y D5: un tendero inactivo de otra zona responde solo el mensaje general» |
| CA17 | RT «CA17: si otro envío guarda el mismo documento antes del INSERT, responde 409 y queda un solo tendero»; MIG «impide repetir tipo y número de documento (CA13, CA17)» |
| CA18 | RT «CA18: responde 400 con el mensaje aprobado y no crea nada»; VAL «un nombre de la tienda con solo espacios cuenta como vacío (CA18)» |
| CA19 | RT «CA19: responde 400 con el mensaje aprobado y no crea nada»; VAL «rechaza el teléfono %s (CA19)» |
| CA20 | RT «CA20: responde 400 con el mensaje aprobado y no crea nada»; VAL «rechaza un correo sin arroba (CA20)» |
| CA21 | RT «CA5 y CA21: rechaza DI 99912 con su mensaje y no crea nada» (todas las pruebas de RT llaman a la API sin el formulario) |
| CA22 | RTW «ante un duplicado muestra el mensaje de la API y conserva lo escrito (CA22)»; E2E «CA22 y CA13…» |
| CA23 | RT «CA23: guarda D'Luis idéntico»; VAL «quita los espacios de los extremos y conserva el interior (D2, CA23)» |
| CA24 | RT «CA24: responde 404 si el vendedor no existe y no crea nada» |
| CA25 | RTW «al guardar con éxito vuelve a la lista con «Tendero registrado» y la recarga con el tendero nuevo (CA25)»; TW «muestra «Tendero registrado» al volver del registro y pide la lista del vendedor (CA25)»; E2E «CA25 y CA2…» |

## Casos borde cubiertos fuera de los CA

- Normalización (anexo, P11 b): RT con puntos; PA con espacios, puntos y mayúsculas y minúsculas mezcladas (DOC, RT).
- Teléfono (P2): se rechazan `+57 5550001`, `(555) 0000001` y `555.0000001` (VAL, RT).
- D1: `tipoDocumento: "di"` → «Elige el tipo de documento: DI, RT o PA.»; `vendedorId` `"1"`, `-1` o `1.5` → «Falta el vendedor.» (VAL, RT).
- D3 y D10: cada cuerpo sin mensaje por defecto de zod da el mensaje aprobado exacto que le corresponde (VAL, RT); un cuerpo que es un arreglo o que no es JSON → 400 con el mensaje general (RT).
- Claves que no son del contrato (`id`, `vendedor_id`, `creado_en`) no cambian el tendero 1 de `test-data/` (RT).
- Formulario: al volver a guardar se ve solo el mensaje nuevo de la API (RTW); muestra el mensaje de un 400 y conserva lo escrito (RTW, PT6).

## Diferencias con la tabla del plan

- El paso 3 dice cubrir CA15 a nivel de base, pero `migraciones.test.ts` no tiene una prueba de CA15. El índice es el mismo de CA13.
- El plan asigna CA2 al test 1 del e2e, pero ese test solo comprueba la lista de V-101.
- CA5 ya no se asigna a `RegistrarTendero.test.tsx`: esa prueba simula la respuesta de la API y comprueba PT6, no CA5.
- CA17 ya no se prueba con dos `POST` en `Promise.all`, porque `node:sqlite` es síncrono y nunca se intercalan. La prueba simula otro envío justo antes del `INSERT`.

## Sin decidir (sin prueba)

- **Número solo con puntos (`...`):** hoy da el mensaje del DI. Falta decidir si cuenta como número vacío (D10).
- **Espacio no separable en el documento:** hoy se rechaza.
- **Texto de 100 caracteres con espacios en los extremos:** hoy se acepta, porque se recorta antes de medir. Tampoco está decidido cómo cuentan las tildes descompuestas.
- **Claves extra en el cuerpo:** falta decidir si se ignoran o se rechazan.
- **Doble clic en «Guardar»:** el botón no se desactiva mientras se envía.
- **Falla de red:** hoy se ve «Failed to fetch». El texto de D11 casi nunca aparece, porque `llamar` siempre lanza un `Error`.
- **CA2 de extremo a extremo:** no se comprueba la lista de V-102.
