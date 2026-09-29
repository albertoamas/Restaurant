import { describe, it, expect } from 'vitest';
import { cashResult } from './cash-result';

describe('cashResult', () => {
  it('cuadra cuando la diferencia es cero o solo redondeo', () => {
    expect(cashResult(0)).toEqual({ label: 'Cuadra', tone: 'success' });
    expect(cashResult(0.004)).toEqual({ label: 'Cuadra', tone: 'success' });
  });

  it('sobrante y faltante con el monto en positivo', () => {
    expect(cashResult(1)).toEqual({ label: 'Sobró Bs 1.00', tone: 'warning' });
    expect(cashResult(-2.5)).toEqual({ label: 'Faltó Bs 2.50', tone: 'error' });
  });

  it('en vivo usa presente', () => {
    expect(cashResult(-2, true).label).toBe('Faltan Bs 2.00');
    expect(cashResult(3, true).label).toBe('Sobran Bs 3.00');
  });
});
