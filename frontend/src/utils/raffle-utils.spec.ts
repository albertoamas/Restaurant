import { describe, it, expect } from 'vitest';
import { positionLabel } from './raffle-utils';

describe('positionLabel', () => {
  it('retorna "1er lugar" para posición 1', () => {
    expect(positionLabel(1)).toBe('1er lugar');
  });

  it('retorna "2do lugar" para posición 2', () => {
    expect(positionLabel(2)).toBe('2do lugar');
  });

  it('retorna "3er lugar" para posición 3', () => {
    expect(positionLabel(3)).toBe('3er lugar');
  });

  it('retorna "N° lugar" para posiciones superiores a 3', () => {
    expect(positionLabel(4)).toBe('4° lugar');
    expect(positionLabel(10)).toBe('10° lugar');
  });
});
