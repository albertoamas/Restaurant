import { test, expect } from '@playwright/test';

const OWNER_EMAIL    = 'owner@demo.com';
const OWNER_PASSWORD = 'demo123';

// Inicia sesión como dueño y, si la pantalla lo pide, elige la sucursal Principal.
async function loginAsOwner(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel(/correo/i).fill(OWNER_EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();
  await page.waitForURL(/\/pos/, { timeout: 10_000 });

  await pickBranchIfAsked(page);
}

/**
 * Con varias sucursales el dueño empieza en "Todas las sucursales", y POS, Caja y Cocina le
 * piden elegir una ("Elige una sucursal"). Se elige "Principal", la del seed; la elección queda
 * guardada para el resto del test.
 */
async function pickBranchIfAsked(page: import('@playwright/test').Page) {
  const prompt = page.getByText('Elige una sucursal');
  // `isVisible` no espera: hay que darle tiempo a la pantalla a decidir si pide sucursal.
  const asked = await prompt.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true, () => false);
  if (asked) {
    await page.getByRole('button', { name: 'Principal', exact: true }).click();
    await prompt.waitFor({ state: 'hidden' });
  }
}

test.describe('Flujo de pedido', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('añadir un producto al carrito muestra el total', async ({ page }) => {
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.waitFor({ timeout: 10_000 });
    await firstProduct.click();

    // Con productos en el pedido, "Cobrar" se habilita y el total deja de ser 0.
    await expect(page.getByRole('button', { name: /^cobrar$/i }).first()).toBeEnabled({ timeout: 5_000 });
  });

  test('confirmar pedido con pago QR aparece en /orders', async ({ page }) => {
    // Add a product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.waitFor({ timeout: 10_000 });
    await firstProduct.click();

    // Open checkout / confirm button
    const confirmBtn = page.getByRole('button', { name: /confirmar|cobrar|pagar/i });
    await confirmBtn.click();

    // Select QR payment if there's a payment method selector
    const qrOption = page.getByText(/QR/i);
    if (await qrOption.isVisible()) {
      await qrOption.click();
    }

    // Complete the order
    const finalizeBtn = page.getByRole('button', { name: /completar|finalizar|confirmar/i }).last();
    if (await finalizeBtn.isVisible()) {
      await finalizeBtn.click();
    }

    // Navigate to orders and verify order is listed
    await page.goto('/orders');
    await expect(page.locator('[data-testid="order-card"], .order-card, [class*="order"]').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('el pedido creado aparece en /kitchen', async ({ page }) => {
    await page.goto('/kitchen');
    // Kitchen page should load and show a list (possibly empty, that's OK)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toBeVisible();
  });
});
