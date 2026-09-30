import { describe, it, expect } from 'vitest';
import { formatAmountAxis, formatBsFull, formatDayTick } from './chartFormat';

describe('formatAmountAxis', () => {
  it('deja los montos menores a mil tal cual', () => {
    expect(formatAmountAxis(0)).toBe('0');
    expect(formatAmountAxis(999)).toBe('999');
  });

  it('abrevia desde mil, sin decimal cuando es redondo', () => {
    expect(formatAmountAxis(1000)).toBe('1k');
    expect(formatAmountAxis(30000)).toBe('30k');
  });

  it('muestra un decimal cuando no es redondo', () => {
    expect(formatAmountAxis(22500)).toBe('22.5k');
  });

  // La ganancia puede ser negativa: el eje baja de cero.
  it('abrevia también los negativos', () => {
    expect(formatAmountAxis(-1500)).toBe('-1.5k');
  });
});

describe('formatBsFull', () => {
  it('siempre con dos decimales', () => {
    expect(formatBsFull(1234.5)).toBe('Bs 1234.50');
  });
});

describe('formatDayTick', () => {
  it('día y mes corto para el eje, sin cruzar de día', () => {
    expect(formatDayTick('2026-09-15')).toMatch(/^15 sept?\.?$/);
    expect(formatDayTick('2026-10-01')).toMatch(/^1 oct\.?$/);
  });
});
