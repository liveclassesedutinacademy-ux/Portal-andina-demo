# Backlog del Portal Andina · sprint 1

Historias escritas por el product owner de Andina. Distribuidora Andina y Nodo Software son empresas ficticias.

| Id | Historia | Prioridad |
|---|---|---|
| HU-101 | Registro de tenderos | Alta |
| HU-102 | Edición de datos del tendero | Alta |
| HU-103 | Búsqueda de tenderos por nombre de tienda | Media |
| HU-104 | Detalle del tendero | Media |
| HU-105 | Mejorar el catálogo | Baja |
| HU-106 | Pedidos del tendero en el portal | Baja |

---

## HU-101 · Registro de tenderos

**Como** vendedor de Andina, **quiero** registrar un tendero nuevo desde el portal **para** poder tomarle pedidos desde la primera visita, sin esperar a que la oficina lo cargue.

**Descripción.** Cuando el vendedor encuentra una tienda nueva en su ruta, abre el portal, llena los datos del tendero y lo guarda. El documento tiene que ser válido según las reglas de Andina. No queremos tenderos repetidos: si ya está registrado, no se debe crear otra vez. El tendero queda en la zona del vendedor.

**Criterios de aceptación**
- El vendedor puede registrar un tendero con sus datos.
- El documento se valida.
- No se registran tenderos duplicados.
- Al guardar, el tendero aparece en la lista de tenderos.

**Notas.** Los datos son los mismos que hoy se anotan en el formato de papel: nombre, tienda, documento, teléfono, correo y dirección.

---

## HU-102 · Edición de datos del tendero

**Como** vendedor de Andina, **quiero** corregir los datos de un tendero **para** que la información de contacto esté al día cuando lo visito o lo llamo.

**Descripción.** Desde la lista de tenderos, el vendedor entra a editar un tendero, cambia lo que haya cambiado y guarda. Muchos tenderos cambian de número de teléfono o no dieron correo al principio. Los datos tienen que quedar bien escritos.

**Criterios de aceptación**
- El vendedor puede editar los datos del tendero.
- El teléfono y el correo se validan.
- Los cambios se guardan y se ven en la lista.

**Notas.** La pantalla de edición ya existe, pero no guarda.

---

## HU-103 · Búsqueda de tenderos por nombre de tienda

**Como** vendedor de Andina, **quiero** buscar en mi lista de tenderos por el nombre de la tienda **para** encontrar rápido la tienda que estoy visitando.

**Criterios de aceptación**
1. En la lista de tenderos hay un campo «Buscar tienda».
2. Al escribir 3 o más caracteres, la lista muestra solo los tenderos cuyo nombre de tienda contiene el texto, sin distinguir mayúsculas, minúsculas ni tildes.
3. Con menos de 3 caracteres, o con el campo vacío, se muestra la lista completa de la zona.
4. Si ningún tendero coincide, se muestra el mensaje «No hay tiendas con ese nombre en tu zona».
5. La búsqueda solo recorre los tenderos de la zona del vendedor.

**Datos de prueba.** Con `V-101` (zona Norte), «esq» devuelve solo «Tienda La Esquina»; «ROBLE» devuelve «Minimercado El Roble»; «pinos» no devuelve nada, porque «Minimercado Los Pinos» es de la zona Sur.

**Dependencias.** Ninguna; usa el endpoint actual de tenderos.

---

## HU-104 · Detalle del tendero

**Como** vendedor de Andina, **quiero** ver todos los datos de un tendero en una pantalla **para** revisarlos antes de la visita.

**Criterios de aceptación**
1. En la lista de tenderos, el nombre de la tienda lleva a la pantalla de detalle.
2. El detalle muestra: nombre de la tienda, nombre del tendero, tipo y número de documento, teléfono, correo, dirección, zona y estado.
3. Un dato vacío se muestra como «Sin dato».
4. Si el tendero no existe, la pantalla muestra «No encontramos este tendero» y un enlace a la lista.
5. La pantalla usa `GET /api/tenderos/:id`, que ya existe; no se cambia la API.

**Datos de prueba.** El tendero 4 no tiene teléfono y el tendero 3 no tiene correo; el tendero 9999 no existe.

---

## HU-105 · Mejorar el catálogo

**Como** vendedor, **quiero** un catálogo mejor **para** vender más.

**Criterios de aceptación**
- El catálogo es más fácil de usar.
- Carga rápido.
- Se ve bien en el celular.

---

## HU-106 · Pedidos del tendero en el portal

**Como** tendero, **quiero** hacer mis pedidos en el portal y pagarlos en línea **para** no depender de la visita del vendedor.

**Descripción.** El tendero entra al portal, arma su pedido con el catálogo y los precios, lo paga con tarjeta o transferencia y recibe la confirmación. El pedido llega al ERP para despacho y facturación.

**Criterios de aceptación**
- El tendero puede hacer pedidos.
- Puede pagar en línea.
- El pedido llega al ERP.
