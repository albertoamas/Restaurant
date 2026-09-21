import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class DeleteExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly repo: ExpenseCategoryRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const category = await this.repo.findById(id, tenantId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    await this.repo.delete(id, tenantId);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CATEGORY_DELETED, { id });
  }
}
