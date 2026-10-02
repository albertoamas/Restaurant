import { test, expect } from '@playwright/test';

const OWNER_EMAIL    = 'owner@demo.com';
const OWNER_PASSWORD = 'demo123';

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

test.describe('Sesión de caja', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.goto('/cash');
    await pickBranchIfAsked(page);
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
      // El monto empieza vacío y es obligatorio: sin él, "Abrir caja" queda deshabilitado.
      await page.getByLabel(/efectivo con el que empieza el cajón/i).fill('500');
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

    // El conteo empieza vacío (no se prellena con el esperado) y es obligatorio.
    await page.getByLabel(/efectivo contado/i).fill('500');
    // El resultado aparece en vivo antes de confirmar.
    await expect(page.getByText('Resultado del conteo')).toBeVisible();

    // Confirm button text: "Cerrar caja" (inside the modal, .last() picks it over any others)
    await page.getByRole('button', { name: /^cerrar caja$/i }).last().click();

    // El cierre aparece en "Últimos cierres" con su resultado en palabras.
    await expect(page.getByText('Últimos cierres')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/^(Cuadra|Sobró Bs|Faltó Bs)/).first()).toBeVisible();
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

    // POS: un producto, Cobrar, Efectivo y Confirmar pedido.
    await page.goto('/pos');
    await pickBranchIfAsked(page);
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.waitFor({ timeout: 10_000 });
    await firstProduct.click();

    await page.getByRole('button', { name: /^cobrar$/i }).first().click();
    const payment = page.getByRole('dialog');
    // El pago pide tipo de pedido y cliente antes de confirmar.
    await payment.getByRole('radiogroup', { name: 'Tipo de pedido' }).getByRole('radio', { name: /^local/i }).click();
    await payment.getByRole('button', { name: 'Sin cliente para este pedido' }).click();
    await payment.getByRole('radiogroup', { name: 'Método de pago' }).getByRole('radio', { name: /efectivo/i }).click();
    await payment.getByRole('button', { name: 'Exacto' }).click();
    await payment.getByRole('button', { name: /confirmar pedido/i }).click();

    // PosPage shows: "No hay caja abierta. Ve a Caja y abre el turno antes de cobrar en efectivo."
    await expect(page.getByText(/no hay caja abierta/i)).toBeVisible({ timeout: 5_000 });
  });
});
