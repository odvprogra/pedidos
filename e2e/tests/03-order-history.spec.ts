import { expect, test } from '@playwright/test';
import { moveOrder, openRestaurant, placeOrder, registerAccount } from '../support/seed';
import { logIn, money } from '../support/ui';

test('E2E 03 · a customer finds an order in the history and reads its detail', async ({ page }) => {
  const restaurant = await openRestaurant('Pollos Kiki', [
    { name: 'Cuarto de pollo', price: 35 },
    { name: 'Refresco', price: 12.5 },
  ]);
  const customer = await registerAccount('Sofía Mendoza', 'CUSTOMER');
  const older = await placeOrder(customer, restaurant, { Refresco: 1 });
  const orderId = await placeOrder(customer, restaurant, { 'Cuarto de pollo': 2, Refresco: 1 });
  await moveOrder(restaurant, orderId, 'accept', 'start-preparing');

  await logIn(page, customer);
  await page.getByRole('link', { name: 'Mis pedidos' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mis pedidos' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Pedido #\d+ de Pollos Kiki/ })).toHaveCount(2);
  await expect(
    page.getByRole('link', { name: `Pedido #${older} de Pollos Kiki, Pendiente` }),
  ).toBeVisible();

  await page
    .getByRole('link', { name: `Pedido #${orderId} de Pollos Kiki, En preparación` })
    .click();

  await expect(page).toHaveURL(new RegExp(`/pedidos/${orderId}$`));
  await expect(page.getByRole('heading', { level: 1, name: `Pedido #${orderId}` })).toBeVisible();
  await expect(page.locator('[data-status]')).toHaveText('En preparación');
  const items = page.locator('[data-item]');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText(/2 ×\s*Cuarto de pollo/);
  await expect(items.nth(0)).toContainText(money('70,00'));
  await expect(items.nth(1)).toContainText(/1 ×\s*Refresco/);
  await expect(page.locator('[data-total]')).toHaveText(money('82,50'));
});

test('E2E 03 · a customer does not see the orders of another customer', async ({ page }) => {
  const restaurant = await openRestaurant('Salteñería Paceña', [{ name: 'Salteña', price: 9 }]);
  const buyer = await registerAccount('Iván Choque', 'CUSTOMER');
  const someoneElse = await registerAccount('Rita Flores', 'CUSTOMER');
  const orderId = await placeOrder(buyer, restaurant, { Salteña: 3 });

  await logIn(page, someoneElse);
  await page.getByRole('link', { name: 'Mis pedidos' }).click();
  await expect(page.getByRole('heading', { name: 'Todavía no hiciste pedidos' })).toBeVisible();

  await page.goto(`/pedidos/${orderId}`);
  await expect(page.getByRole('heading', { name: 'No encontramos este pedido' })).toBeVisible();
  await expect(page.getByText('Salteña')).toHaveCount(0);
});
