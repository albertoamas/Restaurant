import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';

@Injectable()
export class DeleteExpenseConceptUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,
  ) {}

  /** Baja lógica: los gastos ya registrados conservan su snapshot y su vínculo. */
  async execute(id: string, tenantId: string): Promise<void> {
    const concept = await this.repo.findById(id, tenantId);
    if (!concept) throw new NotFoundException('Gasto predefinido no encontrado');
    await this.repo.deactivate(id, tenantId);
  }
}
