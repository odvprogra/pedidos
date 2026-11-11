import { expect, test } from '@playwright/test';
import { ADMIN } from '../support/environment';
import { openRestaurant, placeOrder, registerAccount } from '../support/seed';
import { logIn } from '../support/ui';

test('E2E 05 · a visitor is sent to log in before seeing private pages', async ({ page }) => {
  const customer = await registerAccount('Paula Rivas', 'CUSTOMER');

  await page.goto('/pedidos');

  await expect(page).toHaveURL(/\/ingresar\?returnUrl=%2Fpedidos$/);
  await page.getByLabel('Correo', { exact: true }).fill(customer.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(customer.password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page).toHaveURL(/\/pedidos$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mis pedidos' })).toBeVisible();
});

test('E2E 05 · a customer cannot open the admin panel nor the restaurant panel', async ({
  page,
}) => {
  await logIn(page, await registerAccount('Hugo Salas', 'CUSTOMER'));

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/restaurantes$/);
  await expect(page.getByRole('heading', { name: 'Cuentas' })).toHaveCount(0);

  await page.goto('/mi-restaurante');
  await expect(page).toHaveURL(/\/restaurantes$/);
  await expect(page.getByRole('link', { name: 'Panel' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Mi restaurante' })).toHaveCount(0);
});

test('E2E 05 · an owner cannot open the admin panel', async ({ page }) => {
  const restaurant = await openRestaurant('Anticuchos Don Pepe', [
    { name: 'Anticucho', price: 20 },
  ]);

  await logIn(page, restaurant.owner);
  await page.goto('/admin/restaurantes');

  await expect(page).toHaveURL(/\/mi-restaurante$/);
  await expect(page.getByRole('heading', { name: 'Restaurantes', level: 1 })).toHaveCount(0);
});

test('E2E 05 · the admin opens the panel that the others cannot', async ({ page }) => {
  await logIn(page, ADMIN);

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Cuentas' })).toBeVisible();
  await page.getByRole('link', { name: 'Restaurantes', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Restaurantes' })).toBeVisible();
});

test('E2E 05 · a customer cannot change the status of an order, even through the API', async ({
  page,
}) => {
  const restaurant = await openRestaurant('Api Morado', [{ name: 'Api con pastel', price: 18 }]);
  const customer = await registerAccount('Lucía Torrez', 'CUSTOMER');
  const orderId = await placeOrder(customer, restaurant, { 'Api con pastel': 1 });
  await logIn(page, customer);

  const token = (await page.context().cookies()).find((cookie) => cookie.name === 'XSRF-TOKEN');
  const response = await page.request.post(`/api/v1/restaurants/mine/orders/${orderId}/accept`, {
    headers: { 'X-XSRF-TOKEN': token?.value ?? '' },
  });

  expect(response.status()).toBe(403);
  expect((await response.json()).code).toBe('access_denied');
  const order = await customer.api.get<{ status: string }>(`/api/v1/orders/${orderId}`);
  expect(order.status).toBe('PLACED');
});
