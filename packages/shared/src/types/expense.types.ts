import type { PaymentMethod } from './enums';

export type ExpenseStatus = 'ACTIVE' | 'VOIDED';

export interface ExpenseCategoryDto {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
  trackQuantity: boolean;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  icon?: string;
}

export interface ExpenseConceptDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  unit: string | null;
  defaultUnitPrice: number | null;
  isActive: boolean;
}

export interface UpdateExpenseCategoryRequest {
  name?: string;
  icon?: string | null;
}

export interface CreateExpenseConceptRequest {
  categoryId: string;
  name: string;
  unit?: string;
  defaultUnitPrice?: number | null;
}

export interface UpdateExpenseConceptRequest {
  categoryId?: string;
  name?: string;
  unit?: string | null;
  defaultUnitPrice?: number | null;
}

export interface ExpenseItemDto {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  conceptId: string | null;
  name: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateExpenseItemRequest {
  categoryId?: string;
  conceptId?: string;
  name: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
}

export interface ExpenseDto {
  id: string;
  branchId: string;
  /** Legacy field: enum key for old expenses, category name for new ones. */
  category: string;
  /** Total amount (sum of items for new expenses, or the direct amount for legacy ones). */
  amount: number;
  description: string | null;
  expenseDate: string;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod | null;
  supplierName: string | null;
  documentNumber: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  items: ExpenseItemDto[];
  createdBy: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  items: CreateExpenseItemRequest[];
  description?: string;
  expenseDate?: string;
  paymentMethod?: PaymentMethod;
  supplierName?: string;
  documentNumber?: string;
  branchId?: string;
}

export interface UpdateExpenseRequest {
  items: CreateExpenseItemRequest[];
  description?: string;
  expenseDate?: string;
  paymentMethod?: PaymentMethod;
  supplierName?: string;
  documentNumber?: string;
}

export interface VoidExpenseRequest {
  reason?: string;
}

export interface ExpenseSummaryDto {
  total: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
  transactionCount: number;
}

/**
 * Lo gastado en un mismo ítem durante el período (`GET /expenses/summary/items`). Los ítems de un
 * gasto predefinido se agrupan por su id (renombrarlo no parte el historial); los escritos a mano,
 * por nombre sin mayúsculas ni espacios de más. Cada unidad va en su propia fila: sumar kg con
 * unidades no tendría sentido.
 */
export interface ExpenseItemSummaryDto {
  /** Misma clave que `ExpenseSummaryDto.byCategory`. */
  category: string;
  conceptId: string | null;
  /** `null`: gastos viejos registrados sin ítems ("Sin detalle"). */
  name: string | null;
  unit: string | null;
  quantity: number;
  total: number;
  /** Gastos (compras) distintos en los que aparece. */
  purchases: number;
}

/**
 * Topes de la lista de gastos por negocio. Son técnicos, no del plan: la pantalla muestra la lista
 * completa de una vez. Solo cuentan los activos (lo eliminado o quitado no ocupa lugar).
 */
export const EXPENSE_CATALOG_LIMITS = {
  categories: 20,
  concepts:   100,
} as const;

export interface SuggestedExpenseCategory {
  name: string;
  icon: string;
  /** Pide cantidad y unidad al registrar (insumos que se compran por kg, unidad, etc.). */
  trackQuantity: boolean;
  /** Gastos de la categoría: [nombre, unidad o null]. */
  concepts: [name: string, unit: string | null][];
}

/**
 * Catálogo sugerido, corto y genérico (sirve a un restaurante, una cafetería o una heladería). No se
 * crea solo: el dueño lo carga desde la pestaña Lista y elige qué categorías quiere.
 */
export const SUGGESTED_EXPENSE_CATALOG: SuggestedExpenseCategory[] = [
  {
    name: 'Insumos', icon: '🧂', trackQuantity: true,
    concepts: [['Carnes', 'kg'], ['Verduras y frutas', 'kg'], ['Abarrotes', null], ['Bebidas para la venta', 'unidad']],
  },
  { name: 'Personal',   icon: '👤', trackQuantity: false, concepts: [['Sueldos', 'mes'], ['Adelanto de sueldo', null]] },
  { name: 'Servicios',  icon: '💡', trackQuantity: false, concepts: [['Luz', 'mes'], ['Agua', 'mes'], ['Gas', null], ['Internet', 'mes']] },
  { name: 'Alquiler',   icon: '🏠', trackQuantity: false, concepts: [['Alquiler del local', 'mes']] },
  { name: 'Operativos', icon: '🧽', trackQuantity: false, concepts: [['Limpieza', null], ['Empaques', null], ['Reparaciones', null]] },
  { name: 'Otros',      icon: '📋', trackQuantity: false, concepts: [['Transporte', null], ['Otro gasto', null]] },
];
