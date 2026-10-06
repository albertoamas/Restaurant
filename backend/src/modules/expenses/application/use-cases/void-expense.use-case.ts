import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { EventsService } from '../../../events/events.service';

/** Anula un gasto (baja lógica): deja de contar en totales y reportes, el registro se conserva. */
@Injectable()
export class VoidExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, userId: string, reason?: string): Promise<void> {
    const voided = await this.expenseRepository.void(id, tenantId, userId, reason?.trim() || null);
    // Antes respondía 204 y avisaba a todos aunque el gasto no existiera o ya estuviera anulado.
    if (!voided) throw new NotFoundException('Gasto no encontrado o ya anulado');
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_DELETED, { id });
  }
}
