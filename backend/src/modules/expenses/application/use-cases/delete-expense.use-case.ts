import { Inject, Injectable, Optional } from '@nestjs/common';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    await this.expenseRepository.delete(id, tenantId);
    // Emit to all branches of the tenant — frontend reloads on any expense.deleted
    this.eventsService?.emitToTenant(tenantId, 'expense.deleted', { id });
  }
}
