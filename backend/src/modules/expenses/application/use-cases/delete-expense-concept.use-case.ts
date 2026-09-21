import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class DeleteExpenseConceptUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  /** Baja lógica: los gastos ya registrados conservan su snapshot y su vínculo. */
  async execute(id: string, tenantId: string): Promise<void> {
    const concept = await this.repo.findById(id, tenantId);
    if (!concept) throw new NotFoundException('Gasto predefinido no encontrado');
    await this.repo.deactivate(id, tenantId);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CONCEPT_DELETED, { id });
  }
}
