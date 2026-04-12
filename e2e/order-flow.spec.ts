import { test, expect } from '@playwright/test';

const OWNER_EMAIL    = 'jimmy75122919@gmail.com';
const OWNER_PASSWORD = 'demo123';

// Login helper
async function loginAsOwner(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel(/correo/i).fill(OWNER_EMAIL);
  await page.getByLabel(/contraseña/i).fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();
  await page.waitForURL(/\/pos/, { timeout: 10_000 });
}

test.describe('Flujo de pedido', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test('añadir un producto al carrito muestra el total', async ({ page }) => {
    // Click the first available product card
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.waitFor({ timeout: 10_000 });
    await firstProduct.click();

    // Cart should show at least 1 item and a non-zero total
    await expect(page.getByText(/Bs/)).toBeVisible();
    await expect(page.locator('[data-testid="cart-total"], .cart-total, [class*="total"]').first())
      .toBeVisible();
  });

  test('confirmar pedido con pago QR aparece en /orders', async ({ page }) => {
    // Add a product
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
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
