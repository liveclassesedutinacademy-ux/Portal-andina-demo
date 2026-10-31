# Despliegue de laboratorio

Distribuidora Andina y Nodo Software son empresas ficticias.

El workflow `.github/workflows/despliegue-laboratorio.yml` despliega la rama principal al ambiente **«laboratorio»** cada vez que algo se fusiona en ella. También se puede lanzar a mano desde la pestaña Actions.

## Qué hace

1. Instala las dependencias (`npm ci`).
2. Corre las pruebas de la API y de la web (`npm test`), la revisión de tipos (`npm run lint`) y la validación de la documentación (`npm run docs:validar`).
3. Construye la web (`npm run build -w apps/web`).
4. Guarda el paquete desplegado como artefacto, con el commit en el nombre: la web construida, el código de la API, las migraciones y los `package.json`.

Si un paso falla, el despliegue queda registrado como fallido y no se guarda el paquete.

## Dónde queda la evidencia

Cada corrida queda en **Environments › laboratorio** del repositorio, con su fecha, su commit y su resultado. Es la evidencia del nivel «despliegue» de la Definition of Done.

El ambiente no publica el portal en ningún servidor: no hay una dirección para visitarlo.

## Qué no cubre

- No corre las pruebas de extremo a extremo (`npm run test:e2e`), porque necesitan un navegador.
- Solo despliega la rama principal. Una historia cuyo pull request no está fusionado no está desplegada.
