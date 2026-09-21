import type { ExpenseDto } from '@pos/shared';

/**
 * Los gastos viejos guardaban la clave del enum en `Expense.category`; los nuevos
 * guardan el nombre de la categoría. Este mapa traduce solo las claves legacy.
 */
const LEGACY_LABELS: Record<string, string> = {
  SUPPLIES:    'Insumos',
  WAGES:       'Personal',
  UTILITIES:   'Servicios',
  TRANSPORT:   'Transporte',
  MAINTENANCE: 'Mantenimiento',
  OTHER:       'Otro',
};

/** Traduce una clave legacy a su etiqueta; cualquier otro valor se devuelve tal cual. */
export function legacyExpenseLabel(category: string): string {
  return LEGACY_LABELS[category] ?? category;
}

/** Etiqueta visible de un gasto: categoría del primer ítem, o su categoría legacy. */
export function expenseCategoryLabel(expense: ExpenseDto): string {
  return expense.items[0]?.categoryName ?? legacyExpenseLabel(expense.category);
}
