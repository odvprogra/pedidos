import { expect, test } from '@playwright/test';
import { openRestaurant, registerAccount } from '../support/seed';
import { logIn, money } from '../support/ui';

test('E2E 01 · a customer places an order from the menu to the confirmation', async ({ page }) => {
  await openRestaurant('La Casona', [
    { name: 'Silpancho', price: 45 },
    { name: 'Limonada', price: 10.5 },
  ]);
  const customer = await registerAccount('Ana Rojas', 'CUSTOMER');

  await logIn(page, customer);
  await page.getByRole('link', { name: 'La Casona, Abierto' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'La Casona' })).toBeVisible();

  await page.getByRole('button', { name: 'Agregar Silpancho al carrito' }).click();
  await page.getByRole('button', { name: 'Agregar Limonada al carrito' }).click();
  await page.getByRole('link', { name: /^Ver carrito/ }).click();
  await expect(page).toHaveURL(/\/carrito$/);

  const lemonade = page.getByRole('article', { name: 'Limonada' });
  const lemonadeQuantity = lemonade.getByRole('group', { name: 'Cantidad de Limonada' });
  await lemonadeQuantity.getByRole('button', { name: 'Una unidad más' }).click();
  await lemonadeQuantity.getByRole('button', { name: 'Una unidad más' }).click();
  await lemonadeQuantity.getByRole('button', { name: 'Una unidad menos' }).click();

  await expect(lemonadeQuantity).toContainText('2');
  await expect(lemonade).toContainText(money('10,50'));
  await expect(lemonade).toContainText(money('21,00'));
  await expect(page.getByRole('article', { name: 'Silpancho' })).toContainText(money('45,00'));
  const summary = page.getByRole('complementary', { name: 'Resumen' });
  await expect(summary).toContainText('Productos3');
  await expect(summary).toContainText(/Total\s*Bs\s66,00/);

  await page.getByRole('button', { name: 'Confirmar pedido' }).click();

  await expect(page.getByRole('heading', { level: 1, name: '¡Pedido confirmado!' })).toBeVisible();
  const placed = page.getByRole('heading', { name: /^Pedido #\d+$/ });
  await expect(placed).toBeVisible();
  await expect(page.locator('[data-total]')).toHaveText(money('66,00'));
  await expect(page.locator('[data-status]')).toHaveText('Pendiente');
});
