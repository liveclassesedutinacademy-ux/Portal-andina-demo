import { expect, test, type Page } from '@playwright/test';

// HU-101 de extremo a extremo: web → POST /api/tenderos → SQLite en memoria.
// La base se comparte entre los tests de la corrida, por eso cada uno usa su propio DI de la historia.

/** Ingresa con V-101 y abre el formulario desde el enlace de la lista (la sesión no sobrevive a page.goto). */
async function abrirRegistro(page: Page) {
  await page.goto('/');
  await page.getByLabel('Código de vendedor').fill('V-101');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('link', { name: 'Tenderos' }).click();
  await expect(page.getByRole('heading', { name: 'Tenderos de la zona Norte' })).toBeVisible();
  await page.getByRole('link', { name: 'Registrar tendero' }).click();
  await expect(page.getByRole('heading', { name: 'Registrar tendero' })).toBeVisible();
}

/** Llena el formulario con los datos válidos base de la historia HU-101 y el DI indicado. */
async function llenarDatosBase(page: Page, numeroDocumento: string) {
  await page.getByLabel('Tipo de documento').selectOption('DI');
  await page.getByLabel('Número de documento').fill(numeroDocumento);
  await page.getByLabel('Nombre del tendero').fill('Prueba Norte');
  await page.getByLabel('Nombre de la tienda').fill('Tienda Prueba Norte');
  await page.getByLabel('Teléfono').fill('5550000001');
  await page.getByLabel('Correo').fill('prueba@ejemplo.test');
  await page.getByLabel('Dirección').fill('Dirección de prueba 1');
}

test('CA25 y CA2: registra un tendero y vuelve a la lista con «Tendero registrado»', async ({ page }) => {
  await abrirRegistro(page);
  await llenarDatosBase(page, '999124011');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByRole('heading', { name: 'Tenderos de la zona Norte' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Tendero registrado');
  const fila = page.locator('tbody tr', { hasText: 'DI 999124011' });
  await expect(fila).toHaveCount(1);
  await expect(fila).toContainText('Tienda Prueba Norte');
});

test('CA22 y CA13: un DI repetido con puntos muestra el mensaje y conserva lo escrito', async ({ page }) => {
  await abrirRegistro(page);
  await llenarDatosBase(page, '999123456');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('status')).toHaveText('Tendero registrado');

  await page.getByRole('link', { name: 'Registrar tendero' }).click();
  await llenarDatosBase(page, '999.123.456');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByRole('alert')).toHaveText('Este tendero ya está registrado.');
  await expect(page.getByLabel('Tipo de documento')).toHaveValue('DI');
  await expect(page.getByLabel('Número de documento')).toHaveValue('999.123.456');
  await expect(page.getByLabel('Nombre del tendero')).toHaveValue('Prueba Norte');
  await expect(page.getByLabel('Nombre de la tienda')).toHaveValue('Tienda Prueba Norte');
  await expect(page.getByLabel('Teléfono')).toHaveValue('5550000001');
  await expect(page.getByLabel('Correo')).toHaveValue('prueba@ejemplo.test');
  await expect(page.getByLabel('Dirección')).toHaveValue('Dirección de prueba 1');
});
