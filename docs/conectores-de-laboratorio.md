# Conectores de laboratorio: Jira y GitHub en solo lectura

Distribuidora Andina y Nodo Software son empresas ficticias.

TEC-TRC-04 conecta Claude Code con dos sistemas del portal para enlazar cada historia con su evidencia:

| Activo | Sistema | Qué lee | Cómo se limita a lectura |
| --- | --- | --- | --- |
| D23 | Jira del portal (proyecto `PA`) | Épicas, historias, errores, estados y vínculos | El conector usa un usuario con el rol «Visualizador» en el proyecto `PA` y ningún permiso en otros proyectos (V20) |
| D24 | GitHub del portal (este repositorio) | Pull requests, revisiones, corridas de Actions y despliegues | El servidor MCP de GitHub corre en modo de solo lectura, con un token fino que solo lee este repositorio y vence en 30 días o menos (V21) |

## Reglas

- Los conectores se configuran en el equipo de quien los usa, nunca en este repositorio (regla 15). No hay archivos de configuración MCP versionados aquí.
- La solo lectura la imponen las cuentas, no las instrucciones. Antes del primer uso, cada conector se prueba con una escritura que tiene que fallar; el resultado se guarda como evidencia de V20 y V21.
  - **Excepción conocida:** el rol «Visualizador» de un proyecto de Jira gestionado por el equipo permite comentar. Los comentarios en Jira solo los impide esta regla, no la cuenta.
- Ningún token ni credencial se guarda en el repositorio ni en su historial (regla 11).
- El proyecto de Jira solo trae datos inventados del caso. Si una incidencia llega a traer datos de una persona, se retira del proyecto y se avisa (regla 18).

## Qué no se hace con los conectores

Crear, editar, comentar o cambiar el estado de incidencias. Abrir, comentar, aprobar o fusionar pull requests. Lanzar workflows. Cualquiera de esas acciones se hace a mano, por la persona responsable, fuera de Claude.

## Pruebas de las cuentas (31-10-2026)

| Activo | Qué se comprobó | Resultado |
| --- | --- | --- |
| D23 · Jira | Permisos del usuario del conector en `PA` | Puede ver y comentar. No puede editar, cambiar de estado, crear, borrar, vincular ni asignar incidencias. V20 cerrado con la excepción de los comentarios |
| D24 · GitHub | Servidor y token del conector | Servidor en modo de solo lectura, sin herramientas de escritura. Token fino con lectura de actions, code, deployments, environments, issues, metadata y pull requests de este repositorio, sin permisos de usuario, vence el 30-11-2026. V21 cerrado |

Con los dos conectores, Claude se negó a editar y a comentar por esta regla, sin intentar la escritura.
