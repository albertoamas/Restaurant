import { describe, it, expect } from 'vitest';
import type { ExpenseItemSummaryDto } from '@pos/shared';
import { expenseItemName, expenseItemTags, groupExpenseItems } from './expense-items-report';

const item = (p: Partial<ExpenseItemSummaryDto>): ExpenseItemSummaryDto => ({
  category: 'Insumos', conceptId: null, name: 'X', unit: null, quantity: 1, total: 10, purchases: 1, ...p,
});

describe('groupExpenseItems', () => {
  it('agrupa por categoría y ordena de mayor a menor', () => {
    const groups = groupExpenseItems([
      item({ name: 'Aceite', total: 5 }),
      item({ name: 'Luz', category: 'Servicios', total: 40 }),
      item({ name: 'Carne', total: 50 }),
    ]);
    expect(groups.get('Insumos')!.top.map((i) => i.name)).toEqual(['Carne', 'Aceite']);
    expect(groups.get('Servicios')!.top).toHaveLength(1);
  });

  it('pasa del límite a "Otros" con su total', () => {
    const items = Array.from({ length: 13 }, (_, n) => item({ name: `i${n}`, total: 100 - n }));
    const g = groupExpenseItems(items, 10).get('Insumos')!;
    expect(g.top).toHaveLength(10);
    expect(g.rest.map((i) => i.name)).toEqual(['i10', 'i11', 'i12']);
    expect(g.restTotal).toBe(90 + 89 + 88);
  });

  it('si sobra uno solo lo muestra en vez de un "Otros (1)"', () => {
    const items = Array.from({ length: 11 }, (_, n) => item({ name: `i${n}`, total: 100 - n }));
    const g = groupExpenseItems(items, 10).get('Insumos')!;
    expect(g.top).toHaveLength(11);
    expect(g.rest).toEqual([]);
  });
});

describe('expenseItemTags', () => {
  it('con unidad: cantidad, promedio y compras', () => {
    expect(expenseItemTags(item({ unit: 'kg', quantity: 34, total: 717.4, purchases: 3 })))
      .toEqual(['34 kg', 'Bs 21.10 por kg', '3 compras']);
  });

  it('pluraliza la unidad y recorta decimales', () => {
    expect(expenseItemTags(item({ unit: 'unidad', quantity: 2.5, total: 25, purchases: 1 })))
      .toEqual(['2.5 unidades', 'Bs 10.00 por unidad', '1 compra']);
  });

  it('sin unidad: solo las compras', () => {
    expect(expenseItemTags(item({ quantity: 3, total: 446, purchases: 3 }))).toEqual(['3 compras']);
  });

  it('gasto viejo sin ítems', () => {
    const legacy = item({ name: null, quantity: 0, total: 99 });
    expect(expenseItemName(legacy)).toBe('Sin detalle');
    expect(expenseItemTags(legacy)).toEqual(['1 compra']);
  });
});
