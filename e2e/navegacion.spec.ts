import { expect, test } from '@playwright/test';

test('el vendedor ingresa, consulta el catálogo y ve los tenderos de su zona', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de vendedor').fill('V-101');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(12);

  await page.getByLabel('Categoría').selectOption('Aseo');
  await expect(page.locator('tbody tr').first()).toContainText('Aseo');

  await page.getByRole('link', { name: 'Tenderos' }).click();
  await expect(page.getByRole('heading', { name: 'Tenderos de la zona Norte' })).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
});

test('un código de vendedor desconocido muestra un error', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Código de vendedor').fill('V-999');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});
