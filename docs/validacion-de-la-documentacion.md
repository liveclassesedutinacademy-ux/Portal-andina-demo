# Validación de la documentación

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este repositorio son inventados.

En este repositorio la documentación se valida como se valida el código: con un script que corre en el pipeline de cada pull request. Si el cambio y su documentación no van en el mismo pull request, el pipeline falla.

- Script: `scripts/validar-documentacion.mjs`
- Comando: `npm run docs:validar` (`node scripts/validar-documentacion.mjs --json` para el informe en JSON)
- Pipeline: `.github/workflows/documentacion.yml`, en cada pull request y en cada empuje a `main`
- Sale con código 1 si hay algún incumplimiento, así que bloquea la fusión

## Qué comprueba

| Control | Qué comprueba | Qué lo rompe |
|---|---|---|
| C1 · Citas | Toda cita `archivo:línea` de `docs/` apunta a un archivo que existe y a una línea que existe | Mover o acortar un archivo citado, o renombrarlo |
| C2 · Endpoints | Toda ruta registrada en `apps/api/src/routes` está en la tabla de endpoints de `docs/contexto-del-portal.md` | Agregar un endpoint y no documentarlo |
| C3 · Mensajes | Todo mensaje de error literal de la API aparece en algún documento | Cambiar el texto de un error, o agregar uno nuevo |
| C4 · Decisiones | Todo ADR de `docs/decisiones` está en el índice del README | Escribir un ADR y no agregarlo al índice |
| C5 · Migraciones | Toda migración de `apps/api/migrations` se menciona en `docs/` | Agregar una migración y no documentar el cambio de esquema |
| C6 · Parámetros | Todo `req.query.<nombre>` que lea la API está en la tabla de endpoints | Agregar un filtro o un parámetro nuevo sin documentarlo |
| C7 · Rutas de la web | Toda ruta de `apps/web/src/App.tsx` aparece en `docs/` | Agregar una pantalla y no documentarla |

Una cita a un archivo cuyo nombre se repite en el repositorio sale como **aviso**, no como incumplimiento: el script no puede saber a cuál de los dos se refiere.

C3 se conforma con que el texto del mensaje aparezca en **cualquier** documento, y la descripción del pull request cuenta. Si el mensaje nuevo solo está ahí, el control pasa en verde y la tabla de endpoints se queda sin él: revísalo a mano.

## Qué no comprueba

El script revisa que lo que la documentación afirma siga existiendo; no revisa que siga siendo verdad. Puede pasar en verde una documentación que cite la línea correcta y describa mal lo que hace. Esa mitad la revisa una persona en el pull request, con la lista de `docs/lista-de-revision-codigo-generado.md`.

Y hay cambios en los que **ningún control falla**. Ocurrió con HU-104, que agrega la ruta `/tenderos/:id` a la web: C7 busca la ruta como subcadena en `docs/`, y ese texto ya aparece en ocho documentos —dentro de `/tenderos/:id/editar`, en `GET /api/tenderos/:id` y en la propia historia—, así que el control no puede fallar. C1 tampoco falla cuando un archivo citado solo crece: las citas viejas siguen apuntando a líneas que existen, pero de otro código. En esos cambios la regla la sostiene únicamente la revisión del pull request.

En concreto, el script no detecta:

- Una funcionalidad declarada «hecha» que ninguna prueba cubra de extremo a extremo.
- Una regla de negocio documentada al revés.
- Un estado («hecho», «parcial», «pendiente») que quedó viejo después de corregir un defecto.
- Una decisión que otra decisión superó, si nadie cambió el estado del ADR.
- Una ruta nueva de la web cuyo texto ya aparezca en algún documento por otro motivo (C7 compara subcadenas).
- Una cita que se desplazó porque el archivo creció: la línea existe y dice otra cosa.

## Cómo se agrega un control

Cada control es un bloque del script, con su identificador y su mensaje. Para agregar uno:

1. Escribe el bloque y llama a `fallo('Cn', documento, mensaje)` por cada incumplimiento, o empuja a `avisos` cuando el script no pueda decidir.
2. Agrega `'Cn'` a la lista del resumen y su nombre al mapa `nombres`.
3. Agrégalo a la tabla de este documento, con qué lo rompe.
4. Corre `npm run docs:validar` sobre `main` antes de abrir el pull request: un control nuevo que deja `main` en rojo se arregla o se acota antes de entrar.
