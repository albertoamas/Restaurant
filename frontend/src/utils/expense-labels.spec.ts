import { describe, it, expect } from 'vitest';
import { pluralUnit } from './expense-labels';

describe('pluralUnit', () => {
  it('pluraliza palabras y deja abreviaturas', () => {
    expect(pluralUnit('unidad', 7)).toBe('unidades');
    expect(pluralUnit('caja', 2)).toBe('cajas');
    expect(pluralUnit('mes', 3)).toBe('meses');
    expect(pluralUnit('kg', 6)).toBe('kg');
    expect(pluralUnit('unidad', 1)).toBe('unidad');
  });
});
