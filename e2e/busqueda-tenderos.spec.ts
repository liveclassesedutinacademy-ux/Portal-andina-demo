import { expect, test, type Page } from '@playwright/test';

// HU-103 de extremo a extremo: web → GET /api/tenderos?buscar= → SQLite en memoria.
// Datos de prueba de la historia (backlog-sprint-1.md:58). La base se comparte con registro-tendero.spec.ts,
// que agrega «Tienda Prueba Norte» a la zona Norte: por eso la lista completa se comprueba por nombre y no por cantidad.

const ZONA_NORTE = ['Autoservicio La 20', 'Minimercado El Roble', 'Tienda Doña Rosa', 'Tienda El Parque', 'Tienda La Esquina'];
/** Tiendas de las zonas Sur y Centro de test-data/: no pueden aparecer en la lista de V-101. */
const OTRAS_ZONAS = [
  'Tienda San José', 'Minimercado Los Pinos', 'Tienda El Ahorro', 'Granero La Cosecha', 'Tienda Las Palmas',
  'Tienda Central', 'Minimercado La Plaza', 'Tienda El Faro', 'Autoservicio Mi Barrio', 'Tienda La Estación',
];

/** Ingresa con el código indicado y abre la lista de tenderos (la sesión no sobrevive a page.goto). */
async function abrirTenderos(page: Page, codigoVendedor: string, zona: string) {
  await page.goto('/');
  await page.getByLabel('Código de vendedor').fill(codigoVendedor);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Tenderos' }).click();
  await expect(page.getByRole('heading', { name: `Tenderos de la zona ${zona}` })).toBeVisible();
}

const tiendas = (page: Page) => page.locator('tbody tr td:first-child');

/** CA3: la lista completa de la zona Norte, sin tiendas de otras zonas. */
async function esperarZonaNorteCompleta(page: Page) {
  for (const tienda of ZONA_NORTE) await expect(tiendas(page).filter({ hasText: tienda })).toHaveCount(1);
  for (const tienda of OTRAS_ZONAS) await expect(tiendas(page).filter({ hasText: tienda })).toHaveCount(0);
}

test('CA1 a CA3: V-101 busca por nombre de tienda sin distinguir mayúsculas ni tildes', async ({ page }) => {
  await abrirTenderos(page, 'V-101', 'Norte');
  const campo = page.getByLabel('Buscar tienda');
  await expect(campo).toBeVisible();
  await esperarZonaNorteCompleta(page);

  await campo.fill('esq');
  await expect(tiendas(page)).toHaveText(['Tienda La Esquina']);

  await campo.fill('ROBLE');
  await expect(tiendas(page)).toHaveText(['Minimercado El Roble']);

  await campo.fill('dona');
  await expect(tiendas(page)).toHaveText(['Tienda Doña Rosa']);

  await campo.fill('ésq');
  await expect(tiendas(page)).toHaveText(['Tienda La Esquina']);

  await campo.fill('es');
  await esperarZonaNorteCompleta(page);

  await campo.fill('esq');
  await expect(tiendas(page)).toHaveText(['Tienda La Esquina']);
  await campo.fill('e');
  await esperarZonaNorteCompleta(page);

  await campo.fill('esq');
  await expect(tiendas(page)).toHaveText(['Tienda La Esquina']);
  await campo.fill('');
  await esperarZonaNorteCompleta(page);
});

test('CA4 y CA5: «pinos» no devuelve nada para V-101 (es de la zona Sur) y sí para V-102', async ({ page }) => {
  await abrirTenderos(page, 'V-101', 'Norte');
  await page.getByLabel('Buscar tienda').fill('pinos');
  await expect(page.getByText('No hay tiendas con ese nombre en tu zona')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(0);

  await abrirTenderos(page, 'V-102', 'Sur');
  await page.getByLabel('Buscar tienda').fill('pinos');
  await expect(tiendas(page)).toHaveText(['Minimercado Los Pinos']);
  await expect(page.getByText('No hay tiendas con ese nombre en tu zona')).not.toBeVisible();
});

test('CA2: V-102 encuentra «Tienda San José» escribiendo «jose», sin tilde', async ({ page }) => {
  await abrirTenderos(page, 'V-102', 'Sur');
  await page.getByLabel('Buscar tienda').fill('jose');
  await expect(tiendas(page)).toHaveText(['Tienda San José']);
});
