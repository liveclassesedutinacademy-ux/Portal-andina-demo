# Contexto del Portal Andina

Distribuidora Andina y Nodo Software son empresas ficticias. Todos los datos de este documento son inventados.

## 1. El negocio

Distribuidora Andina vende productos de consumo masivo (abarrotes, bebidas, aseo y snacks) a tiendas de barrio. Cada tienda la atiende un **vendedor** que recorre una **zona** (Norte, Sur o Centro) y toma los pedidos del **tendero**, el dueño o encargado de la tienda.

Hoy, cuando un vendedor encuentra una tienda nueva, anota los datos del tendero en papel y los envía a la oficina, que los carga en el sistema días después. Mientras tanto, el vendedor no puede tomarle pedidos. Andina quiere que el vendedor registre al tendero desde el portal en el momento de la visita.

Nodo Software construye el portal para Andina. El proyecto está en la fase 4 (construcción) y este es el sprint 1.

## 2. Usuarios

| Usuario | Qué hace en el portal |
|---|---|
| Vendedor | Consulta el catálogo y la lista de tenderos de su zona. Con este sprint, registra tenderos nuevos y corrige sus datos. |
| Oficina comercial de Andina | No usa el portal todavía. Hoy recibe los registros en papel. |

El vendedor entra con su código (por ejemplo, `V-101`). En este sprint el ingreso es simulado: no hay contraseñas.

## 3. Qué hace hoy el portal

| Módulo | Estado |
|---|---|
| Ingreso del vendedor | Hecho. Sesión simulada con el código del vendedor. |
| Catálogo | Hecho. Lista de productos con filtro por categoría; no muestra precios. |
| Tenderos de la zona | Hecho, solo lectura. Lista de los tenderos de la zona del vendedor. |
| Registro de tenderos | Por construir en este sprint. |
| Edición de datos del tendero | Por construir en este sprint. La pantalla existe, pero no valida los datos ni guarda los cambios. |

## 4. Arquitectura

```
Navegador ──> apps/web (React + Vite, puerto 5173)
                 │  /api/*  (proxy de Vite en desarrollo)
                 ▼
             apps/api (Node.js + Express, puerto 3001)
                 │
                 ▼
             SQLite (apps/api/data/portal.db; en memoria en las pruebas)
```

- **apps/web**: React 19 con TypeScript y React Router. Las llamadas a la API están en `src/lib/api.ts`. La sesión del vendedor vive en un contexto de React (`src/lib/sesion.tsx`).
- **apps/api**: Express 5 con TypeScript. Las rutas están en `src/routes/`. Las entradas se validan con zod. La base se crea con las migraciones de `apps/api/migrations/` y se carga con los datos de `test-data/`.
- **Pruebas**: Vitest y Supertest para la API, Vitest y Testing Library para la web, Playwright para las pruebas de extremo a extremo.

### Endpoints actuales

| Método y ruta | Qué hace | Errores |
|---|---|---|
| `GET /api/salud` | Comprueba que la API responde. | — |
| `POST /api/sesion` | Recibe `{ codigoVendedor }` y devuelve el vendedor. | 400 si falta el código; 401 si no existe. |
| `GET /api/catalogo?categoria=` | Lista los productos, con filtro opcional. | — |
| `GET /api/tenderos?vendedorId=` | Lista los tenderos de la zona del vendedor. | 400 si falta o no es un número; 404 si el vendedor no existe. |
| `GET /api/tenderos/:id` | Devuelve un tendero. | 400 si el id no es un número; 404 si no existe. |

## 5. Datos del tendero

| Campo | Descripción |
|---|---|
| Tipo de documento | DI, RT o PA. Las reglas están en `docs/reglas-documento-tendero.md`. |
| Número de documento | Según el tipo. |
| Nombre | Nombre del tendero. |
| Nombre de la tienda | Nombre comercial. |
| Teléfono | Teléfono de contacto. |
| Correo | Correo de contacto. |
| Dirección | Dirección de la tienda. |
| Zona | Norte, Sur o Centro. |
| Vendedor | Vendedor que atiende la tienda. |
| Estado | `activo` o `inactivo`. |

En la base, la tabla `tenderos` no tiene hoy ninguna restricción que impida repetir un documento.

## 6. Reglas de negocio conocidas

1. Cada vendedor atiende una sola zona y ve solo los tenderos de esa zona.
2. Un tendero se identifica por su tipo y número de documento.
3. El documento debe cumplir las reglas del anexo de Andina (`docs/reglas-documento-tendero.md`).
4. El portal no muestra precios; los precios los maneja el ERP de Andina, que no se conecta en este sprint.

## 7. Datos de prueba

Los datos de `test-data/` los genera `test-data/generar.mjs` con valores inventados: los documentos empiezan por `999`, los teléfonos usan el prefijo ficticio `555` y los correos el dominio reservado `ejemplo.test`. Hay 3 vendedores (`V-101` Norte, `V-102` Sur, `V-103` Centro), 12 productos y 15 tenderos.

## 8. Glosario

| Término | Significado |
|---|---|
| Tendero | Dueño o encargado de una tienda de barrio, cliente de Andina. |
| Vendedor | Empleado de Andina que visita a los tenderos de una zona y toma sus pedidos. |
| Zona | Área geográfica asignada a un vendedor: Norte, Sur o Centro. |
| DI | Documento de identidad de una persona. |
| RT | Registro tributario, para tenderos que operan como empresa. |
| PA | Pasaporte, para tenderos extranjeros. |
| ERP | Sistema de gestión de Andina donde viven precios, pedidos y facturación. |
