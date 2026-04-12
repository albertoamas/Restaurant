import { test, expect } from '@playwright/test';

// Seed credentials (demo tenant created by `pnpm --filter backend seed`)
const OWNER_EMAIL    = 'jimmy75122919@gmail.com';
const OWNER_PASSWORD = 'demo123';

test.describe('Autenticación', () => {
  test('login válido redirige a /pos', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(OWNER_EMAIL);
    await page.getByLabel(/contraseña/i).fill(OWNER_PASSWORD);
    await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();

    await expect(page).toHaveURL(/\/pos/, { timeout: 10_000 });
  });

  test('contraseña incorrecta muestra mensaje de error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo/i).fill(OWNER_EMAIL);
    await page.getByLabel(/contraseña/i).fill('wrong-password');
    await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();

    // Toast de error o mensaje en pantalla
    await expect(page.getByText(/credencial|inválid|incorrect/i)).toBeVisible({ timeout: 5_000 });
  });

  test('acceder a /orders sin autenticar redirige a /login', async ({ page }) => {
    // Clear any stored token
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
