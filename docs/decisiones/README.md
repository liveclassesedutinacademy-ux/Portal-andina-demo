# Registro de decisiones de arquitectura · Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de esta carpeta son inventados.

## Para qué sirve un ADR en este repositorio

Hasta ahora las decisiones del portal quedaron repartidas entre comentarios del código, las decisiones del equipo de cada historia (`docs/planes/HU-*-decisiones-del-equipo.md`), los riesgos de las descripciones de PR y la auditoría, que anotó que el repositorio no tiene ningún registro de decisiones de arquitectura (`docs/auditoria-documentacion.md:72`). Quien llega nuevo no puede distinguir una decisión de un descuido.

Un ADR (registro de decisión de arquitectura) junta en un solo archivo **una** decisión que afecta a más de una historia: qué problema había, qué se decidió, qué se descartó, qué cuesta y qué queda abierto. Las decisiones que solo afectan a una historia siguen en los documentos de esa historia.

## Índice

| Número | Título | Estado | Fecha |
|---|---|---|---|
| [0001](0001-identificacion-del-vendedor.md) | Identificación del vendedor por el `vendedorId` que envía el cliente | Propuesto | No consta (registro escrito el 30-10-2026) |

Cuando se agrega o cambia el estado de un ADR, se actualiza esta tabla en el mismo pull request.

## Formato

**Nombre del archivo:** `NNNN-titulo-en-minusculas.md`, con el número siguiente al último del índice. Los números no se reutilizan.

**Encabezado:** `# ADR NNNN · Título`.

**Citas:** cada afirmación lleva el archivo y la línea, o el commit, donde se comprueba. Se marca qué **consta** (está escrito en un documento, un comentario o un commit) y qué es **deducido** (sale de leer el código). Si el material no dice quién decidió o cuándo, se escribe así, sin poner un responsable ni una fecha probables.

Las siete secciones, en este orden:

1. **Estado:** propuesto, aceptado o superado, y la fecha si consta. Si no consta, se dice. Si está superado, se enlaza el ADR que lo supera.
2. **Contexto:** qué problema había y en qué momento del proyecto, en cinco líneas como máximo, con sus citas.
3. **Decisión:** qué se hace hoy, en una frase, y dónde está implementado (archivo y línea).
4. **Alternativas consideradas:** tabla con la alternativa, dónde consta que se evaluó y por qué no se tomó. Solo entran las que de verdad se evaluaron. Si no consta ninguna, se escribe «No consta que se evaluaran alternativas». Lo que propondría hoy quien escribe el ADR va a Pendientes, no aquí.
5. **Consecuencias:** tabla de dos partes, lo que facilita y lo que cuesta, cada fila con su evidencia.
6. **Riesgo abierto:** al menos uno, con la evidencia del código que lo hace posible, dónde ya está registrado y qué lo haría innecesario.
7. **Pendientes:** qué hay que decidir después y quién.

Al final va una sección **Dudas**: lo que no se puede decidir leyendo el repositorio y a quién preguntarle. Una duda nunca contradice el material.

## Cómo se reemplaza un ADR

Un ADR no se borra ni se edita su contenido cuando otra decisión lo supera. Se hace así:

1. Se escribe un ADR nuevo, con el número siguiente, que en su **Contexto** enlaza al ADR que supera y explica qué cambió.
2. En el ADR anterior solo se cambia la línea de **Estado**: `Superado por [ADR NNNN](NNNN-titulo.md)`, con la fecha. El resto del texto queda igual, porque es el registro de lo que se decidió en su momento.
3. En el índice, el anterior pasa a «Superado por NNNN» y el nuevo se agrega con su estado.
