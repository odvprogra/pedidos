import { expect, test } from '@playwright/test';
import { openRestaurant, placeOrder, registerAccount } from '../support/seed';
import { logIn } from '../support/ui';

test('E2E 02 · the restaurant takes an order from pending to completed', async ({ page }) => {
  const restaurant = await openRestaurant('El Fogón', [
    { name: 'Pique macho', price: 60 },
    { name: 'Mocochinchi', price: 8 },
  ]);
  const customer = await registerAccount('Leo Vargas', 'CUSTOMER');
  const orderId = await placeOrder(customer, restaurant, { 'Pique macho': 1, Mocochinchi: 2 });

  await logIn(page, restaurant.owner);
  await expect(page).toHaveURL(/\/mi-restaurante$/);
  await page
    .getByRole('main')
    .getByRole('link', { name: /^Pedidos/ })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Pedidos' })).toBeVisible();

  const order = page.getByRole('article', { name: `Pedido #${orderId}` });
  const status = order.locator('[data-status]');
  await expect(status).toHaveText('Pendiente');
  await expect(order).toContainText('Pique macho');
  await expect(order).toContainText('Mocochinchi');

  await order.getByRole('button', { name: `Aceptar el pedido #${orderId}` }).click();
  await expect(status).toHaveText('Aceptado');

  await order.getByRole('button', { name: `Empezar a preparar el pedido #${orderId}` }).click();
  await expect(status).toHaveText('En preparación');

  await order.getByRole('button', { name: `Marcar listo el pedido #${orderId}` }).click();
  await expect(status).toHaveText('Listo');

  await order.getByRole('button', { name: `Entregar el pedido #${orderId}` }).click();
  await expect(status).toHaveText('Completado');
  await expect(order.getByRole('button')).toHaveCount(0);

  const seenByCustomer = await customer.api.get<{ status: string }>(`/api/v1/orders/${orderId}`);
  expect(seenByCustomer.status).toBe('PICKED_UP');
});

test('E2E 02 · the restaurant cannot skip a step of the order', async ({ page }) => {
  const restaurant = await openRestaurant('Doña Tota', [{ name: 'Sándwich de chola', price: 15 }]);
  const customer = await registerAccount('Mara Quispe', 'CUSTOMER');
  const orderId = await placeOrder(customer, restaurant, { 'Sándwich de chola': 1 });

  await logIn(page, restaurant.owner);
  await page
    .getByRole('main')
    .getByRole('link', { name: /^Pedidos/ })
    .click();

  const order = page.getByRole('article', { name: `Pedido #${orderId}` });
  await expect(order.getByRole('button')).toHaveText([
    `Rechazar el pedido #${orderId}`,
    `Aceptar el pedido #${orderId}`,
  ]);
  const response = await restaurant.owner.api
    .post(`/api/v1/restaurants/mine/orders/${orderId}/mark-ready`)
    .catch((error: Error) => error.message);
  expect(response).toContain('409');
  expect(response).toContain('order.invalid_transition');
});

test('E2E 02 · the restaurant edits its details and customers see them', async ({ page }) => {
  const restaurant = await openRestaurant('La Esquina', [{ name: 'Sopa de maní', price: 20 }]);

  await logIn(page, restaurant.owner);
  await page.getByRole('button', { name: 'Editar datos' }).click();
  await page.getByLabel('Nombre del restaurante').fill('La Esquina Paceña');
  await page.getByLabel('Tipo de comida').selectOption({ label: 'Parrillas' });
  await page.getByLabel('Dirección').fill('Av. 6 de Agosto 1450');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(
    page.getByRole('main').getByText('Guardaste los cambios de La Esquina Paceña.'),
  ).toBeVisible();
  await expect(page.locator('[data-category]')).toHaveText('Parrillas');

  await page.goto(`/restaurantes/${restaurant.id}`);
  await expect(page.getByRole('heading', { level: 1, name: 'La Esquina Paceña' })).toBeVisible();
  await expect(page.locator('[data-category]')).toHaveText('Parrillas');
  await expect(page.getByRole('main')).toContainText('Av. 6 de Agosto 1450');
});
