import { test, expect } from '@playwright/test';

const OWNER_EMAIL    = 'owner@demo.com';
const OWNER_PASSWORD = 'demo123';

async function loginAsOwner(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel(/correo/i).fill(OWNER_EMAIL);
  await page.getByLabel(/contraseña/i).fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();
  await page.waitForURL(/\/pos/, { timeout: 10_000 });

  // If the sidebar shows "Seleccionar sucursal", pick the first branch
  const noBranchBtn = page.getByRole('button', { name: /seleccionar sucursal/i });
  if (await noBranchBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await noBranchBtn.click();
    await page.locator('[class*="slide-down"] button').first().click();
    await page.waitForTimeout(300);
  }
}

test.describe('Sesión de caja', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/cash');
  });

  test('abrir caja con monto inicial muestra opción de cierre', async ({ page }) => {
    const closeBtn = page.getByRole('button', { name: /cerrar caja/i });
    const openBtn  = page.getByRole('button', { name: /abrir caja/i });

    // Wait for the page to finish loading the session — either button will appear
    await Promise.any([
      closeBtn.waitFor({ state: 'visible', timeout: 10_000 }),
      openBtn.waitFor({ state: 'visible', timeout: 10_000 }),
    ]);

    const isAlreadyOpen = await closeBtn.isVisible();

    if (!isAlreadyOpen) {
      await openBtn.click();
      // Actual label in CashAmountModal: "Monto inicial en efectivo"; confirmLabel: "Abrir caja"
      const amountInput = page.getByLabel(/monto inicial en efectivo/i);
      if (await amountInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await amountInput.fill('500');
      }
      await page.getByRole('button', { name: /^abrir caja$/i }).last().click();
    }

    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
  });

  test('cerrar caja muestra la diferencia calculada', async ({ page }) => {
    const closeBtn = page.getByRole('button', { name: /cerrar caja/i });
    const openBtn  = page.getByRole('button', { name: /abrir caja/i });

    // Wait for session state to load
    await Promise.any([
      closeBtn.waitFor({ state: 'visible', timeout: 10_000 }),
      openBtn.waitFor({ state: 'visible', timeout: 10_000 }),
    ]);

    const isOpen = await closeBtn.isVisible();
    if (!isOpen) {
      test.skip(true, 'No hay sesión de caja abierta para cerrar');
    }

    await closeBtn.click();

    // Actual label in CashAmountModal: "Efectivo contado al cierre"
    const closingInput = page.getByLabel(/efectivo contado al cierre/i);
    if (await closingInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closingInput.fill('500');
    }

    // Confirm button text: "Cerrar caja" (inside the modal, .last() picks it over any others)
    await page.getByRole('button', { name: /^cerrar caja$/i }).last().click();

    // "Diferencia" label appears in the last-closed summary StatRow
    await expect(page.getByText('Diferencia')).toBeVisible({ timeout: 5_000 });
  });

  test('intentar crear pedido CASH con caja cerrada muestra un error', async ({ page }) => {
    const closeBtn = page.getByRole('button', { name: /cerrar caja/i });
    const openBtn  = page.getByRole('button', { name: /abrir caja/i });

    // Wait for session state to load
    await Promise.any([
      closeBtn.waitFor({ state: 'visible', timeout: 10_000 }),
      openBtn.waitFor({ state: 'visible', timeout: 10_000 }),
    ]);

    const isOpen = await closeBtn.isVisible();
    if (isOpen) {
      test.skip(true, 'Hay sesión abierta — este test requiere caja cerrada');
    }

    // Go to POS and try to add item + pay with cash
    await page.goto('/pos');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
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

    // PosPage shows: "No hay caja abierta. Ve a Caja y abre el turno antes de cobrar en efectivo."
    await expect(page.getByText(/no hay caja abierta/i)).toBeVisible({ timeout: 5_000 });
  });
});
