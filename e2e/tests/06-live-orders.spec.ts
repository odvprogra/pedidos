import { Browser, Page, expect, test } from '@playwright/test';
import { Account, openRestaurant, placeOrder, registerAccount } from '../support/seed';
import { logIn } from '../support/ui';

async function signedIn(browser: Browser, account: Account): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page, account);
  return page;
}

async function watchOrders(owner: Page): Promise<void> {
  await owner
    .getByRole('main')
    .getByRole('link', { name: /^Pedidos/ })
    .click();
  await expect(owner.getByRole('heading', { level: 1, name: 'Pedidos' })).toBeVisible();
  await expect(owner.locator('[data-live]')).toHaveText('En vivo');
}

async function followOrder(customer: Page, orderId: number): Promise<void> {
  const connected = customer.waitForResponse((response) =>
    response.url().endsWith('/api/v1/orders/events'),
  );
  await customer.goto(`/pedidos/${orderId}`);
  await connected;
}

test('E2E 06 · the restaurant and the customer see each step without reloading', async ({
  browser,
}) => {
  const restaurant = await openRestaurant('La Cueva', [{ name: 'Salteña', price: 12 }]);
  const customerAccount = await registerAccount('Ana Rojas', 'CUSTOMER');
  const owner = await signedIn(browser, restaurant.owner);
  const customer = await signedIn(browser, customerAccount);
  await watchOrders(owner);

  const orderId = await placeOrder(customerAccount, restaurant, { Salteña: 3 });

  const order = owner.getByRole('article', { name: `Pedido #${orderId}` });
  await expect(order.locator('[data-status]')).toHaveText('Pendiente');
  await expect(order.locator('[data-fresh]')).toHaveText('Nuevo');
  await expect(owner).toHaveTitle(/^\(1\) Pedidos del restaurante/);

  await followOrder(customer, orderId);
  const status = customer.locator('[data-status]');
  await expect(status).toHaveText('Pendiente');

  await order.getByRole('button', { name: `Aceptar el pedido #${orderId}` }).click();
  await expect(status).toHaveText('Aceptado');
  await expect(customer.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0);

  await order.getByRole('button', { name: `Empezar a preparar el pedido #${orderId}` }).click();
  await expect(status).toHaveText('En preparación');

  await order.getByRole('button', { name: `Marcar listo el pedido #${orderId}` }).click();
  await expect(status).toHaveText('Listo');
  await expect(customer.locator('[data-ready-panel]')).toContainText('¡Tu pedido está listo!');
  await expect(customer).toHaveTitle(`¡Listo! Pedido #${orderId} | Pedidos`);
});

test('E2E 06 · the restaurant sees a cancellation without reloading', async ({ browser }) => {
  const restaurant = await openRestaurant('Don Lucho', [{ name: 'Anticucho', price: 18 }]);
  const customerAccount = await registerAccount('Iván Mamani', 'CUSTOMER');
  const orderId = await placeOrder(customerAccount, restaurant, { Anticucho: 2 });
  const owner = await signedIn(browser, restaurant.owner);
  const customer = await signedIn(browser, customerAccount);
  await watchOrders(owner);
  const order = owner.getByRole('article', { name: `Pedido #${orderId}` });
  await expect(order).toBeVisible();

  await followOrder(customer, orderId);
  await customer.getByRole('button', { name: 'Cancelar pedido' }).click();
  await customer.getByRole('button', { name: 'Sí, cancelar' }).click();
  await expect(customer.locator('[data-status]')).toHaveText('Cancelado');

  await expect(owner.getByRole('alert')).toContainText(`El cliente canceló el pedido #${orderId}.`);
  await expect(order).toHaveCount(0);
  await expect(owner).toHaveTitle(/^Pedidos del restaurante/);
});
