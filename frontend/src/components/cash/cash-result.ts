/** Tolerancia de redondeo: una diferencia menor a medio centavo es "Cuadra". */
const EPSILON = 0.005;

export type CashResultTone = 'success' | 'warning' | 'error';

/**
 * Resultado de contar el efectivo contra lo esperado, en palabras: "Cuadra", "Sobró Bs 1.00",
 * "Faltó Bs 2.00". `live` usa presente ("Sobran", "Faltan") para mientras se escribe el conteo.
 */
export function cashResult(difference: number, live = false): { label: string; tone: CashResultTone } {
  if (Math.abs(difference) < EPSILON) return { label: 'Cuadra', tone: 'success' };
  const amount = `Bs ${Math.abs(difference).toFixed(2)}`;
  return difference > 0
    ? { label: `${live ? 'Sobran' : 'Sobró'} ${amount}`, tone: 'warning' }
    : { label: `${live ? 'Faltan' : 'Faltó'} ${amount}`, tone: 'error' };
}
