import { expect, test, type Page } from '@playwright/test';

// HU-102 de extremo a extremo: web → PUT /api/tenderos/:id?vendedorId= → SQLite en memoria.
// La base se comparte entre los tests de la corrida: este es el único que edita «Tienda La Esquina».

/** Ingresa con V-101 y abre la edición de «Tienda La Esquina» desde la lista (la sesión no sobrevive a page.goto). */
async function abrirEdicionEsquina(page: Page) {
  await page.goto('/');
  await page.getByLabel('Código de vendedor').fill('V-101');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Tenderos' }).click();
  await expect(page.getByRole('heading', { name: 'Tenderos de la zona Norte' })).toBeVisible();
  await page.locator('tbody tr', { hasText: 'Tienda La Esquina' }).getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { name: 'Editar datos del tendero' })).toBeVisible();
}

test('CA1, CA4, CA2 y CA18: edita el teléfono y el correo de «Tienda La Esquina» y vuelve a la lista', async ({ page, request }) => {
  await abrirEdicionEsquina(page);

  // CA1: cada campo muestra lo que devuelve GET /api/tenderos/1.
  const { tendero } = await (await request.get('/api/tenderos/1')).json();
  await expect(page.getByLabel('Nombre del tendero')).toHaveValue(tendero.nombre);
  await expect(page.getByLabel('Nombre de la tienda')).toHaveValue(tendero.nombreTienda);
  await expect(page.getByLabel('Teléfono')).toHaveValue(tendero.telefono ?? '');
  await expect(page.getByLabel('Correo')).toHaveValue(tendero.correo ?? '');
  await expect(page.getByLabel('Dirección')).toHaveValue(tendero.direccion);

  // CA4: el mensaje aparece y lo escrito se conserva.
  await page.getByLabel('Teléfono').fill('555-ABC-1234');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('alert')).toHaveText('El teléfono solo puede tener números.');
  await expect(page.getByLabel('Teléfono')).toHaveValue('555-ABC-1234');

  // CA2 y CA18: guarda y la lista muestra el mensaje y el teléfono nuevo.
  await page.getByLabel('Teléfono').fill('5559876543');
  await page.getByLabel('Correo').fill('esquina@ejemplo.test');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('heading', { name: 'Tenderos de la zona Norte' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Datos actualizados');
  await expect(page.locator('tbody tr', { hasText: 'Tienda La Esquina' })).toContainText('5559876543');

  // P7: el correo se comprueba al volver a abrir la edición.
  await page.locator('tbody tr', { hasText: 'Tienda La Esquina' }).getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByLabel('Teléfono')).toHaveValue('5559876543');
  await expect(page.getByLabel('Correo')).toHaveValue('esquina@ejemplo.test');
});
