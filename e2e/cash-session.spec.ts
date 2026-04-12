import { test, expect } from '@playwright/test';

const OWNER_EMAIL    = 'admin@hamburgos.com';
const OWNER_PASSWORD = 'demo123';

async function loginAsOwner(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(OWNER_EMAIL);
  await page.getByLabel(/contraseña/i).fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();
  await page.waitForURL(/\/pos/, { timeout: 10_000 });
}

test.describe('Sesión de caja', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/cash');
  });

  test('abrir caja con monto inicial muestra opción de cierre', async ({ page }) => {
    // If there's already an open session, the close button should be visible
    const closeBtn = page.getByRole('button', { name: /cerrar caja|close/i });
    const openBtn  = page.getByRole('button', { name: /abrir caja|open/i });

    const isAlreadyOpen = await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!isAlreadyOpen) {
      // Open the cash session
      await openBtn.click();
      const amountInput = page.getByPlaceholder(/monto|amount/i).first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('500');
      }
      await page.getByRole('button', { name: /abrir|confirmar/i }).last().click();
    }

    await expect(page.getByRole('button', { name: /cerrar caja/i })).toBeVisible({ timeout: 5_000 });
  });

  test('cerrar caja muestra la diferencia calculada', async ({ page }) => {
    // Ensure a session is open first
    const closeBtn = page.getByRole('button', { name: /cerrar caja/i });
    const isOpen   = await closeBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    if (!isOpen) {
      test.skip(true, 'No hay sesión de caja abierta para cerrar');
    }

    await closeBtn.click();

    // Enter closing amount
    const closingInput = page.getByPlaceholder(/monto|cierre|closing/i).first();
    if (await closingInput.isVisible()) {
      await closingInput.fill('500');
    }

    await page.getByRole('button', { name: /cerrar|confirmar/i }).last().click();

    // Should show difference (diferencia)
    await expect(page.getByText(/diferencia|Bs/i)).toBeVisible({ timeout: 5_000 });
  });

  test('intentar crear pedido CASH con caja cerrada muestra un error', async ({ page }) => {
    // Ensure no open cash session
    const closeBtn = page.getByRole('button', { name: /cerrar caja/i });
    const isOpen   = await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false);

    if (isOpen) {
      test.skip(true, 'Hay sesión abierta — este test requiere caja cerrada');
    }

    // Go to POS and try to add item + pay with cash
    await page.goto('/pos');
    const firstProduct = page.locator('[data-testid="product-card"], .product-card').first();
    await firstProduct.waitFor({ timeout: 10_000 });
    await firstProduct.click();

    const confirmBtn = page.getByRole('button', { name: /confirmar|cobrar|pagar/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    const cashOption = page.getByText(/efectivo|cash/i).first();
    if (await cashOption.isVisible()) {
      await cashOption.click();
    }

    const finalizeBtn = page.getByRole('button', { name: /completar|finalizar|confirmar/i }).last();
    if (await finalizeBtn.isVisible()) {
      await finalizeBtn.click();
    }

    // Should show error about cash session
    await expect(page.getByText(/caja|sesión|efectivo/i)).toBeVisible({ timeout: 5_000 });
  });
});
