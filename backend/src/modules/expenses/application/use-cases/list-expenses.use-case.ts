import { Inject, Injectable } from '@nestjs/common';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';

/** Tope de gastos por página: la pantalla pide de a 30. */
export const MAX_EXPENSES_PER_PAGE = 100;

export interface ListExpensesOptions {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListExpensesUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
  ) {}

  /**
   * Sin `limit` devuelve todo el período, como antes. Con `limit` pagina y aplica los filtros
   * en la base: la pantalla Movimientos ya no descarga un año entero para mostrar 30 filas.
   */
  async execute(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
    options: ListExpensesOptions = {},
  ): Promise<{ data: Expense[]; total: number }> {
    if (!options.limit || !Number.isFinite(options.limit)) {
      const data = await this.expenseRepository.findAll(tenantId, branchId, from, to);
      return { data, total: data.length };
    }
    const limit = Math.min(Math.max(1, Math.floor(options.limit)), MAX_EXPENSES_PER_PAGE);
    const page  = Number.isFinite(options.page) ? Math.max(1, Math.floor(options.page as number)) : 1;
    return this.expenseRepository.findPage(tenantId, branchId, from, to, {
      category: options.category?.trim() || undefined,
      q:        options.q?.trim() || undefined,
      page,
      limit,
    });
  }
}
