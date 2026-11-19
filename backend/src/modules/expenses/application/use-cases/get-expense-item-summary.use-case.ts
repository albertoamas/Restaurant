import { Inject, Injectable } from '@nestjs/common';
import { ExpenseItemSummaryDto } from '@pos/shared';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';

/** En qué ítem se fue el dinero de cada categoría (pestaña Gastos de reportes). */
@Injectable()
export class GetExpenseItemSummaryUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
  ) {}

  async execute(tenantId: string, branchId: string | null, from: Date, to: Date): Promise<ExpenseItemSummaryDto[]> {
    const rows = await this.expenseRepository.getItemSummary(tenantId, branchId, from, to);
    return [...rows].sort((a, b) => b.total - a.total);
  }
}
