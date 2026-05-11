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

export interface ExpenseItemDto {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateExpenseItemRequest {
  categoryId?: string;
  name: string;
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
  items: ExpenseItemDto[];
  createdBy: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  items: CreateExpenseItemRequest[];
  description?: string;
  branchId?: string;
}

export interface UpdateExpenseRequest {
  items: CreateExpenseItemRequest[];
  description?: string;
}

export interface ExpenseSummaryDto {
  total: number;
  byCategory: Record<string, number>;
}
