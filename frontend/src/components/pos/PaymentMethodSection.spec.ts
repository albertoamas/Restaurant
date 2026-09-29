import { describe, it, expect } from 'vitest';
import { cashSuggestions } from './PaymentMethodSection';

describe('cashSuggestions', () => {
  it('ofrece el monto exacto y los billetes que lo cubren', () => {
    expect(cashSuggestions(47)).toEqual([47, 50, 60, 100]);
  });

  it('no repite un monto que ya es redondo', () => {
    expect(cashSuggestions(50)).toEqual([50, 60, 100, 200]);
  });
});
