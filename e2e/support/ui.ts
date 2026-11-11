import { Page, expect } from '@playwright/test';

export interface Credentials {
  email: string;
  password: string;
}

export async function logIn(page: Page, account: Credentials): Promise<void> {
  await page.goto('/ingresar');
  await page.getByLabel('Correo', { exact: true }).fill(account.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
}

export function money(amount: string): RegExp {
  return new RegExp(`Bs\\s${amount.replace('.', '\\.')}`);
}
