# CLAUDE.md · Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este repositorio son inventados.

Este archivo tiene dos partes: las reglas de seguridad aprobadas para la cuenta (sin cambios respecto de la versión firmada) y las convenciones de trabajo del portal.

# Parte 1 · Reglas de seguridad de la cuenta

## Qué se impone y qué es instrucción

Este archivo no impone nada por sí mismo: lo que aquí es «Instrucción» depende de que Claude lo siga. Lo que impone la configuración está en `.claude/settings.json` (bloque `permissions.deny`, versionado en este repositorio, T7). Esas reglas no se dan por cumplidas hasta que el tech lead registre en el PR la prueba de cada patrón [Verificar V13] y la prueba de que la configuración local o de usuario no las anula [Verificar V14]. El detalle por activo está en la matriz de la cuenta, que es el Apéndice A del anexo de uso de IA. Este archivo no cambia ninguna regla de esa matriz.

- **Config**: la impone `.claude/settings.json`.
- **Externo**: la impone un control fuera de Claude (revisión de PR, consola de la cuenta de Claude, gestor de secretos, persona responsable).
- **Instrucción**: depende de que Claude siga este archivo. Nadie ve evidencia de que Claude la siguió; por eso cada una indica con qué control se evita o se detecta su incumplimiento.

| # | Regla | Cómo se impone | Quién comprueba y evidencia |
|---|---|---|---|
| 1 | No leer configuración con valores de entorno: `.env`, `.env.*`, `config/env/` [Propuesta P3] (D01b, D13) | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 2 | No leer secretos ni llaves: `secrets/`, `.aws/`, `*.pem`, `*.key`, `*.p12`, `*.pfx` [Propuesta P13] (D13) | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 3 | No leer los ejemplos de la API: `api/examples/` [Propuesta P3] (D02b) | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 4 | No leer registros: `*.log`, `logs/` [Propuesta P13] (D12) | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 5 | No leer respaldos ni volcados: `*.bak`, `*.backup`, `*.dump` [Propuesta P13] (D10) | Config [Verificar V13] [Verificar V14] [Verificar V16] | Tech lead · registro de la prueba de reglas en el PR |
| 6 | No leer hojas de cálculo: `*.xlsx`, `*.xls` [Propuesta P13] (D05, D19). [POR DEFINIR: si se excluyen también `.csv`, `.sql` o `.json` de exportes; lo decide el tech lead, que aprueba P13, con V16 cerrado] | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 7 | No leer audio, video ni subtítulos: `*.mp4`, `*.m4a`, `*.mp3`, `*.wav`, `*.vtt`, `*.srt` [Propuesta P13] (D14a, D14b) | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 8 | No leer documentos: `*.docx`, `*.pdf` [Propuesta P13] (D14b) | Config [Verificar V13] [Verificar V14] | Tech lead · registro de la prueba de reglas en el PR |
| 9 | `.claude/settings.json` cambia solo por PR aprobado por el tech lead, y las reglas se prueban antes del primer uso y después de cada cambio (T7) | Externo | Tech lead · historial del archivo y registro de la prueba en el PR |
| 10 | Ningún exporte ni respaldo de D05, D10, D12, D15, D19 ni el script de D03 se guarda en el repositorio | Externo: revisión del listado de archivos al cierre de cada sprint [Propuesta P10]. Las reglas 4 a 8 excluyen algunas extensiones | Tech lead · listado de archivos revisado, incluido el historial |
| 11 | Ningún secreto en el repositorio ni en su historial; escaneo en cada PR con bloqueo de la fusión (T8) | Externo [Verificar V5] [Propuesta P6] | DevOps · reporte del escaneo e inventario del gestor de secretos [Verificar V15] |
| 12 | Las pruebas usan solo datos de `test-data/` (D11) | Externo: QA revisa antes del primer uso y en cada PR que toque pruebas [Propuesta P3] [Verificar V4]. También Instrucción | Tech lead · informe de revisión de QA adjunto al PR |
| 13 | Los datos de `test-data/` salen de un script versionado con valores inventados, sin partir de registros ni precios reales | Externo [Verificar V9]. También Instrucción | Tech lead en el PR del script · script y valores semilla en el repositorio |
| 14 | El contrato OpenAPI no lleva ejemplos en línea; los ejemplos van en `api/examples/` [Propuesta P3] | Externo: el arquitecto aprueba cada PR que modifique el contrato. También Instrucción | Arquitecto · aprobación del PR |
| 15 | El único conector MCP habilitado en la cuenta es el de D21; ninguno al ERP, a la base del portal, a los registros de AWS, a Slack ni a carpetas u hojas compartidas (T3). [POR DEFINIR: si la revisión de T3 incluye los servidores MCP configurados localmente en Claude Code; lo decide el administrador de la cuenta de Claude] | Externo [Verificar V1] [Propuesta P4]. También Instrucción (no agregar servidores MCP en el repositorio) | Administrador de la cuenta de Claude · lista de conectores habilitados |
| 16 | Claude Code se usa solo con cuentas de la organización de Nodo en el plan contratado (T1) | Externo [Propuesta P2] [Verificar V1] [Propuesta P4] | Administrador de la cuenta de Claude · exportación de la lista de miembros |
| 17 | El repositorio no se usa con Claude Code hasta cerrar V2 y V3 (T2) | Externo | Delivery manager · V2 y V3 cerrados con su documento |
| 18 | Si Claude encuentra en un archivo fuera de `test-data/` un nombre, una cédula, un teléfono, una dirección, un saldo o un pedido de un tendero, o el valor de una credencial, llave, token o cadena de conexión, se detiene, no lo repite y avisa a la persona con la que trabaja | Instrucción. Se evita con las reglas 1 a 8, 10 y 11; se detecta con la revisión de QA (regla 12) y el listado de P10 (regla 10) | Nadie ve evidencia de que Claude la siguió |
| 19 | Claude no intenta leer un archivo excluido por otra vía (comandos de terminal, scripts, pedir que se lo peguen). [POR DEFINIR: si la prueba de V13 incluye lectura por terminal y por scripts; lo decide el tech lead] | Instrucción [Verificar V13]. Se evita con las reglas 10 y 11 y con T8 [Verificar V15], que mantienen esos archivos fuera del repositorio y de los equipos; ningún control detecta el intento | Nadie ve evidencia de que Claude la siguió |
| 20 | Un activo nuevo o derivado (D01c, D08b, D17b, D20b, D21b, versiones agregadas o editadas, datos de la app de vendedores) no se usa hasta tener su propia fila en la matriz (T9) | Externo. También Instrucción | Delivery manager · matriz versionada con fecha de revisión |
| 21 | Si una prueba usa registros reales, sale del repositorio como D01c (Restringido) antes de volver a usar Claude Code (D01a, control c) | Externo. También Instrucción; se detecta con la revisión de QA (regla 12) | Tech lead · PR que la retira |
| 22 | No se escriben ejemplos en `api/examples/` mientras no se apruebe construirlos con D11 (D02b, control b) | Externo. También Instrucción; la aprobación del arquitecto lo detecta solo si el PR modifica el contrato | Arquitecto en cada PR del contrato · aprobación del PR |
| 23 | Si un dato Restringido llega a la conversación, Claude se detiene y avisa; las personas siguen el procedimiento de incidentes [Propuesta P11] (T5) | Instrucción (detenerse y avisar). Externo (procedimiento) | Delivery manager · registro de incidentes |

`.claude/settings.json` implementa las reglas 1 a 8, que son las marcadas como Config. Las demás no las impone la configuración.

## Contexto del repositorio

Repositorio de Nodo Software para Distribuidora Andina: portal, app y API del Portal Andina.

## Instrucciones para Claude

### Qué hay en este repositorio
- Código del portal, la app y la API (componentes y pruebas): D01a, Confidencial.
- Archivos de configuración con valores de entorno: D01b, Restringido. Pueden estar en la copia de trabajo, pero no entran a Claude: los excluyen las reglas 1 y 2.
- Contratos de la API de pedidos (rutas y campos): D02a, Confidencial.
- Datos sintéticos de prueba en `test-data/`: D11, Interno [Verificar V9].
- Los activos que la matriz deja fuera del repositorio no deben estar aquí (reglas 10 y 11).

### Datos de prueba
- Usa en las pruebas solo los datos de `test-data/` (regla 12).
- Si generas o amplías datos de prueba, hazlo en el script generador versionado, con valores inventados. No copies ni adaptes nombres, cédulas, teléfonos, direcciones, saldos, pedidos ni precios reales (regla 13).
- Si una prueba usa registros reales, detente y avisa (regla 21).

### Contrato de la API
- No escribas ejemplos en línea en el contrato OpenAPI (regla 14).
- No escribas ejemplos en `api/examples/` mientras no se apruebe construirlos con D11 (regla 22).

### Secretos y configuración
- No escribas valores de credenciales, llaves, tokens ni cadenas de conexión en el código ni en ningún archivo del repositorio (regla 11).
- Si encuentras uno, detente, no lo repitas y avisa (regla 18).
- No intentes leer los archivos excluidos por otra vía (regla 19).

### Configuración de Claude Code
- Cualquier cambio a `.claude/settings.json` va en un PR que aprueba el tech lead (regla 9).
- No agregues ni habilites servidores MCP en este repositorio (regla 15).

### Activos nuevos
- Si una tarea requiere un archivo o un dato que no está en la matriz, no lo uses y avisa: primero necesita su propia fila (regla 20).

### Incidentes
- Si un dato Restringido llegó a la conversación, detente y avisa a la persona con la que trabajas (regla 23). El procedimiento lo siguen las personas: se borra la conversación o el archivo [Verificar V19], se avisa al delivery manager el mismo día hábil [Propuesta P5] y se anota en el registro de incidentes del proyecto [Propuesta P11] (T5).

## Estado de los supuestos que condicionan el uso

- V2 y V3: cerrados con su documento al firmar la política; la regla 17 se cumple y el repositorio puede usarse con Claude Code.
- V13 y V14: la prueba de cada patrón de `.claude/settings.json` y la prueba de que la configuración local no lo anula están registradas en el PR de configuración.
- `api/examples/` no existe en este repositorio y no se crea (reglas 3, 14 y 22).
- Los demás supuestos siguen con el estado que les da la matriz de la cuenta.

# Parte 2 · Convenciones del Portal Andina

## Qué es
Portal web con el que los vendedores de Distribuidora Andina consultan el catálogo y la cartera de tenderos de su zona. Monorepo con dos aplicaciones:

- `apps/api`: API en Node.js + Express 5 + TypeScript. Base de datos SQLite (`node:sqlite`) con migraciones en `apps/api/migrations/`. Validación de entradas con zod.
- `apps/web`: aplicación React 19 + Vite + TypeScript, con React Router.
- `test-data/`: datos sintéticos generados por `test-data/generar.mjs` (regla 13).
- `e2e/`: pruebas de extremo a extremo con Playwright.
- `docs/historias/` y `docs/planes/`: historias de usuario y planes de implementación aprobados.

## Comandos
- `npm install`: instala todo el monorepo.
- `npm run dev`: levanta la API (puerto 3001) y la web (puerto 5173).
- `npm test`: pruebas unitarias y de integración (Vitest y Supertest) de las dos aplicaciones.
- `npm run test:e2e`: pruebas de extremo a extremo (Playwright; levanta la API con una base en memoria).
- `npm run lint`: verificación de tipos de TypeScript en las dos aplicaciones.
- `npm run db:reset`: borra la base local y la vuelve a cargar desde `test-data/`.

## Convenciones de código
- Nombres de dominio en español (`tendero`, `vendedor`, `crearApp`); términos técnicos estándar en inglés cuando no tienen equivalente claro.
- La API responde JSON con campos en camelCase; la base usa snake_case.
- Toda entrada del cliente se valida en la API con zod, aunque el formulario ya la valide.
- Consultas SQL siempre con parámetros (`?`); nunca con texto concatenado.
- Los errores de la API responden `{ "error": "mensaje" }` con el código HTTP que corresponde; el detalle interno no se envía al cliente.
- Cada cambio de esquema va en una migración nueva numerada; no se editan migraciones ya aplicadas.
- Cada ruta nueva de la API lleva su prueba con Supertest; cada componente con lógica lleva su prueba con Testing Library.

## Forma de trabajo
- Antes de escribir código para una historia, se hace un plan en modo plan y se guarda en `docs/planes/` cuando se aprueba.
- Se trabaja en una rama por historia y se integra por pull request revisado.
- `npm test` y `npm run lint` deben pasar antes de abrir el pull request.
