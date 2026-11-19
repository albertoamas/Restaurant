import type { ExpenseItemSummaryDto } from '@pos/shared';
import { bs } from './money';
import { pluralUnit } from './expense-labels';

/** Ítems que se ven al abrir una categoría; el resto va a "Otros". */
export const EXPENSE_ITEMS_TOP = 10;

export interface ExpenseItemGroup {
  top: ExpenseItemSummaryDto[];
  rest: ExpenseItemSummaryDto[];
  restTotal: number;
}

/**
 * Agrupa los ítems por categoría, de mayor a menor gasto, con los `limit` primeros a la vista.
 * Si sobra uno solo, se muestra: un "Otros (1)" esconde lo mismo que ocupa.
 */
export function groupExpenseItems(
  items: ExpenseItemSummaryDto[],
  limit = EXPENSE_ITEMS_TOP,
): Map<string, ExpenseItemGroup> {
  const byCategory = new Map<string, ExpenseItemSummaryDto[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const groups = new Map<string, ExpenseItemGroup>();
  for (const [category, list] of byCategory) {
    const sorted = [...list].sort((a, b) => b.total - a.total);
    const cut  = sorted.length > limit + 1 ? limit : sorted.length;
    const rest = sorted.slice(cut);
    groups.set(category, {
      top: sorted.slice(0, cut),
      rest,
      restTotal: rest.reduce((sum, i) => sum + i.total, 0),
    });
  }
  return groups;
}

const fmtQty = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(3).replace(/0+$/, ''));
const purchases = (n: number) => `${n} ${n === 1 ? 'compra' : 'compras'}`;

/** Nombre visible: los gastos viejos sin ítems salen como "Sin detalle". */
export const expenseItemName = (item: ExpenseItemSummaryDto) => item.name ?? 'Sin detalle';

/**
 * Datos de un ítem en etiquetas cortas: ["34 kg", "Bs 21.10 por kg", "3 compras"]. Cantidad y
 * promedio solo cuando hay unidad: sin ella la cantidad es un contador de veces, no una medida.
 */
export function expenseItemTags(item: ExpenseItemSummaryDto): string[] {
  if (!item.unit || item.quantity <= 0) return [purchases(item.purchases)];
  return [
    `${fmtQty(item.quantity)} ${pluralUnit(item.unit, item.quantity)}`,
    `${bs(item.total / item.quantity)} por ${item.unit}`,
    purchases(item.purchases),
  ];
}
