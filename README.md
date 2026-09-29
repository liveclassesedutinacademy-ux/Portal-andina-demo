# Portal Andina

Repositorio de práctica del curso **Desarrollo de software asistido por IA** de Edutin Academy.
Distribuidora Andina y Nodo Software son empresas ficticias; todos los datos son inventados.

## Requisitos
- Node.js 22.13 o superior (usa el módulo `node:sqlite` incluido en Node).
- Git.

## Primeros pasos
```bash
npm install
npx playwright install chromium   # solo la primera vez, para las pruebas de extremo a extremo
npm run dev
```
Abre http://localhost:5173 e ingresa con el código de vendedor `V-101`, `V-102` o `V-103`.

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la API (3001) y la web (5173) |
| `npm test` | Pruebas unitarias y de integración |
| `npm run test:e2e` | Pruebas de extremo a extremo con Playwright |
| `npm run lint` | Verificación de tipos |
| `npm run db:reset` | Vuelve a cargar la base local desde `test-data/` |

## Puntos de control
El repositorio tiene etiquetas que marcan el estado esperado al terminar cada etapa del curso.
Si te pierdes, puedes comparar tu trabajo con la etiqueta o partir de ella:
```bash
git tag                         # lista los puntos de control
git switch -c mi-rama punto-01-inicio
```

## Estructura
```
apps/api      API (Express + SQLite)
apps/web      Portal web (React + Vite)
test-data     Datos sintéticos y su script generador
e2e           Pruebas de extremo a extremo
docs          Historias de usuario y planes
```
