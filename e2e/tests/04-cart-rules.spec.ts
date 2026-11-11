import { Page, expect, test } from '@playwright/test';
import { Restaurant, openRestaurant, registerAccount } from '../support/seed';
import { logIn } from '../support/ui';

let napoli: Restaurant;
let ito: Restaurant;

test.beforeAll(async () => {
  napoli = await openRestaurant('Pizzería Napoli', [{ name: 'Pizza margarita', price: 70 }]);
  ito = await openRestaurant('Sushi Ito', [{ name: 'Maki de salmón', price: 55 }]);
});

async function fillCartAtNapoli(page: Page): Promise<void> {
  await logIn(page, await registerAccount('Tomás Arce', 'CUSTOMER'));
  await page.getByRole('link', { name: 'Pizzería Napoli, Abierto' }).click();
  await page.getByRole('button', { name: 'Agregar Pizza margarita al carrito' }).click();
  await expect(page.getByText('1 en tu carrito')).toBeVisible();
  await page.goto(`/restaurantes/${ito.id}`);
  await page.getByRole('button', { name: 'Agregar Maki de salmón al carrito' }).click();
}

test('E2E 04 · the cart asks before mixing products of two restaurants', async ({ page }) => {
  await fillCartAtNapoli(page);

  const question = page.getByRole('group', { name: '¿Vaciar tu carrito de Pizzería Napoli?' });
  await expect(question).toBeVisible();
  await question.getByRole('button', { name: 'Mantener mi carrito' }).click();
  await expect(question).toHaveCount(0);

  await page.goto('/carrito');
  await expect(page.getByRole('link', { name: 'Pizzería Napoli' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Pizza margarita' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Maki de salmón' })).toHaveCount(0);
});

test('E2E 04 · the cart starts again with the other restaurant when the customer agrees', async ({
  page,
}) => {
  await fillCartAtNapoli(page);

  const question = page.getByRole('group', { name: '¿Vaciar tu carrito de Pizzería Napoli?' });
  await question.getByRole('button', { name: 'Vaciar y agregar' }).click();

  await page.goto('/carrito');
  await expect(page.getByRole('link', { name: 'Sushi Ito' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Maki de salmón' })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Pizza margarita' })).toHaveCount(0);
});

test('E2E 04 · a sold-out product or a closed restaurant cannot be added', async ({ page }) => {
  const tambo = await openRestaurant('El Tambo', [
    { name: 'Chairo', price: 25 },
    { name: 'Fricasé', price: 40, available: false },
  ]);
  const closed = await openRestaurant('La Cueva', [{ name: 'Charque', price: 50 }], {
    open: false,
  });

  await page.goto(`/restaurantes/${tambo.id}`);
  await expect(page.getByRole('button', { name: 'Agregar Chairo al carrito' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Agregar Fricasé al carrito' })).toBeDisabled();
  await expect(page.getByRole('article', { name: /Fricasé/ })).toContainText('Agotado');

  await page.goto(`/restaurantes/${closed.id}`);
  await expect(page.getByText('Cerrado por ahora')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Agregar Charque al carrito' })).toBeDisabled();
});

test('E2E 04 · an empty cart cannot be confirmed', async ({ page }) => {
  await logIn(page, await registerAccount('Nina Paz', 'CUSTOMER'));

  await page.goto('/carrito');

  await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toHaveCount(0);
});
