# Lista de revisión de código generado

Aplica esta lista a cada cambio que genere Claude antes de confirmarlo. Para cada punto, anota «Sí», «No» o «No aplica» y, si es «No», dónde está el problema (archivo y línea).

## 1. Lógica frente a los criterios de aceptación

| # | Qué revisar | Cómo mirarlo |
|---|---|---|
| 1.1 | Cada criterio de aceptación de la historia tiene código que lo cumple. | Pon la historia al lado del diff y marca, criterio por criterio, dónde se cumple. |
| 1.2 | El cambio no hace más de lo que pide el paso del plan. | Busca archivos o funciones que el paso no menciona. |
| 1.3 | Los casos borde de la historia están tratados (datos vacíos, duplicados, valores en el límite). | Prueba cada caso borde en la aplicación o con una llamada a la API. |
| 1.4 | Las reglas de negocio vienen de los documentos del proyecto y no de supuestos de Claude. | Compara con `docs/contexto-del-portal.md` y `docs/reglas-documento-tendero.md`. |

## 2. Seguridad

| # | Qué revisar | Cómo mirarlo |
|---|---|---|
| 2.1 | Toda entrada del cliente se valida en la API, aunque el formulario ya la valide. | Llama al endpoint directamente (Supertest o `curl`) con datos inválidos, sin pasar por el formulario. |
| 2.2 | Las consultas SQL usan parámetros (`?`); ningún valor que venga del cliente se pega dentro del texto SQL. | Busca en el diff `${`, `+` o concatenaciones dentro de un texto SQL. Prueba un valor con comilla simple, como `D'Luis`. |
| 2.3 | El endpoint solo cambia los campos que la historia permite cambiar. | Envía en el cuerpo un campo que no debería cambiar (por ejemplo, `zona` o `estado`) y revisa si cambió en la base. |
| 2.4 | No hay credenciales, llaves ni cadenas de conexión en el código. | Busca en el diff palabras como `password`, `token`, `secret`, `key`. |
| 2.5 | Los mensajes de error no exponen detalles internos (consultas, rutas, trazas). | Provoca un error y lee la respuesta completa. |

## 3. Manejo de errores

| # | Qué revisar | Cómo mirarlo |
|---|---|---|
| 3.1 | Cada error esperado responde con el código HTTP que corresponde (400, 404, 409…) y el formato `{ "error": "mensaje" }`. | Provoca cada error y revisa el código y el cuerpo. |
| 3.2 | La interfaz muestra al vendedor un mensaje que entiende y no pierde lo que había escrito. | Provoca el error desde el formulario. |
| 3.3 | Ningún error se ignora en silencio (`catch` vacío, promesas sin manejar). | Busca `catch` y llamadas `async` sin `await` en el diff. |

## 4. Rendimiento

| # | Qué revisar | Cómo mirarlo |
|---|---|---|
| 4.1 | No hay consultas dentro de ciclos cuando una sola consulta alcanza. | Busca `prepare` o `get` dentro de `for`, `map` o `forEach`. |
| 4.2 | La interfaz no llama a la API en cada render. | Revisa las dependencias de `useEffect` y la pestaña de red del navegador. |

## 5. Estilo y coherencia con el repositorio

| # | Qué revisar | Cómo mirarlo |
|---|---|---|
| 5.1 | Sigue las convenciones de `CLAUDE.md`: nombres de dominio en español, camelCase en la API, migración nueva para cada cambio de esquema. | Compara con los archivos vecinos. |
| 5.2 | El código nuevo tiene sus pruebas y `npm test` y `npm run lint` pasan. | Ejecuta los dos comandos tú, no confíes en lo que diga Claude. |
| 5.3 | Se entiende sin la conversación con Claude: nombres claros y sin código muerto ni comentarios que repiten el código. | Léelo como si fueras quien lo revisa en el pull request. |
