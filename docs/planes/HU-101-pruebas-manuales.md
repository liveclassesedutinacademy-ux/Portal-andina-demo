# HU-101 · Pruebas manuales y capturas

Hechas el 30 de septiembre de 2026 sobre el commit `c34eecb`, con la API (`PORTAL_DB=:memory:`, base cargada desde `test-data/`) en el puerto 3001 y la web en el 5173. Datos: vendedor V-101 (id 1, zona Norte) y valores inventados de la historia.

## Resultado

| Caso | Esperado | Resultado |
|---|---|---|
| POST con datos válidos (DI `999124555`) | 201 y el tendero en la zona del vendedor | Cumple |
| POST con el mismo DI escrito con puntos (`999.124.555`) | 409 «Este tendero ya está registrado.» | Cumple |
| POST con DI de 5 dígitos | 400 «El documento de identidad debe tener de 6 a 10 dígitos.» | Cumple |
| POST sin teléfono | 400 «El teléfono es obligatorio.» | Cumple |
| POST con JSON mal formado | 400 «Revisa los datos del tendero.» (D10) | Cumple |
| POST sin vendedor | 400 «Falta el vendedor.» | Cumple |
| Recorrido en el navegador (capturas 1 a 5) | Formulario, errores 409 y 400, y «Tendero registrado» en la lista | Cumple |
| Lista con la API inaccesible (captura 6) | Mensaje de D11: «No se pudo cargar la lista de tenderos» | **No cumple:** la pantalla muestra «Failed to fetch» |

## Defecto encontrado (captura 6)
`apps/web/src/pages/Tenderos.tsx`, línea 19: `.catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de tenderos'))`. Cuando la API no responde, `fetch` lanza un `TypeError` con el mensaje del navegador («Failed to fetch»), que es una instancia de `Error`; por eso el texto aprobado en D11 solo se usa si se lanza algo que no sea un `Error`. No se corrigió en este PR: lo decide el equipo (D11).

## Capturas
Carpeta `docs/capturas/HU-101/`: 1 lista con el enlace, 2 formulario vacío, 3 error 409, 4 error 400, 5 lista tras guardar, 6 error de carga.

## Salida de los comandos
```
### POST válido (DI 999124555, V-101)
{"tendero":{"id":18,"tipoDocumento":"DI","numeroDocumento":"999124555","nombre":"Prueba Sur","nombreTienda":"Tienda Prueba","telefono":"5550000002","correo":"a@ejemplo.test","direccion":"Dirección de prueba 2","zona":"Norte","vendedorId":1,"estado":"activo"}}
HTTP 201

### POST repetido con puntos
{"error":"Este tendero ya está registrado."}
HTTP 409

### POST DI corto
{"error":"El documento de identidad debe tener de 6 a 10 dígitos."}
HTTP 400

### POST sin teléfono
{"error":"El teléfono es obligatorio."}
HTTP 400

### POST JSON mal formado
{"error":"Revisa los datos del tendero."}
HTTP 400

### POST sin vendedor
{"error":"Falta el vendedor."}
HTTP 400

### GET lista zona Norte
{"tenderos":[{"id":4,"tipoDocumento":"DI","numeroDocumento":"999100548","nombre":"Carlos Muestra","nombreTienda":"Autoservicio La 20","telefono":null,"correo":"tienda4@ejemplo.test","direccion":"Calle Ficticia 12 n.º 14","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":2,"tipoDocumento":"DI","numeroDocumento":"999100274","nombre":"Luis Ficticio","nombreTienda":"Minimercado El Roble","telefono":"555-0102","correo":"tienda2@ejemplo.test","direccion":"Calle Ficticia 6 n.º 12","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":3,"tipoDocumento":"DI","numeroDocumento":"999100411","nombre":"Marta Ejemplo","nombreTienda":"Tienda Doña Rosa","telefono":"555-0103","correo":null,"direccion":"Calle Ficticia 9 n.º 13","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":5,"tipoDocumento":"RT","numeroDocumento":"999200355-8","nombre":"Elena Sintética","nombreTienda":"Tienda El Parque","telefono":"555-0105","correo":"tienda5@ejemplo.test","direccion":"Calle Ficticia 15 n.º 15","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":1,"tipoDocumento":"DI","numeroDocumento":"999100137","nombre":"Ana Prueba","nombreTienda":"Tienda La Esquina","telefono":"555-0101","correo":"tienda1@ejemplo.test","direccion":"Calle Ficticia 3 n.º 11","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":18,"tipoDocumento":"DI","numeroDocumento":"999124555","nombre":"Prueba Sur","nombreTienda":"Tienda Prueba","telefono":"5550000002","correo":"a@ejemplo.test","direccion":"Dirección de prueba 2","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":16,"tipoDocumento":"DI","numeroDocumento":"999123456","nombre":"Prueba Norte","nombreTienda":"Tienda Prueba Norte","telefono":"5550000001","correo":"prueba@ejemplo.test","direccion":"Dirección de prueba 1","zona":"Norte","vendedorId":1,"estado":"activo"},{"id":17,"tipoDocumento":"DI","numeroDocumento":"999124011","nombre":"Prueba Norte","nombreTienda":"Tienda Prueba Norte","telefono":"5550000001","correo":"prueba@ejemplo.test","direccion":"Dirección de prueba 1","zona":"Norte","vendedorId":1,"estado":"activo"}]}
HTTP 200

```
