import { describe, it, expect } from 'vitest';
import { formatTicketRanges, joinList, positionLabel } from './raffle-utils';

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

describe('formatTicketRanges', () => {
  it('acorta las rachas de tres o más y deja sueltos los demás', () => {
    expect(formatTicketRanges([1, 2, 3, 4, 10, 11])).toBe('#1 al #4, #10 y #11');
  });

  it('un solo ticket', () => {
    expect(formatTicketRanges([7])).toBe('#7');
  });

  it('dos consecutivos no se acortan', () => {
    expect(formatTicketRanges([5, 6])).toBe('#5 y #6');
  });

  it('exactamente tres consecutivos sí', () => {
    expect(formatTicketRanges([3, 4, 5])).toBe('#3 al #5');
  });

  it('ordena y descarta repetidos', () => {
    expect(formatTicketRanges([11, 2, 1, 3, 10, 2])).toBe('#1 al #3, #10 y #11');
  });

  it('varias rachas', () => {
    expect(formatTicketRanges([1, 2, 3, 7, 8, 9, 20])).toBe('#1 al #3, #7 al #9 y #20');
  });

  it('vacío', () => {
    expect(formatTicketRanges([])).toBe('');
  });
});

describe('joinList', () => {
  it('une con comas y una "y" final', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['Hamburguesas'])).toBe('Hamburguesas');
    expect(joinList(['Hamburguesas', 'Milanesas'])).toBe('Hamburguesas y Milanesas');
    expect(joinList(['A', 'B', 'C'])).toBe('A, B y C');
  });
});
