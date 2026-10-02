import { ExpenseConceptEntity } from '../entities/expense-concept.entity';

export const EXPENSE_CONCEPT_REPOSITORY_PORT = 'ExpenseConceptRepositoryPort';

export interface ExpenseConceptRepositoryPort {
  /** Conceptos activos cuya categoría también está activa, ordenados para mostrar. */
  findAll(tenantId: string): Promise<ExpenseConceptEntity[]>;

  findById(id: string, tenantId: string): Promise<ExpenseConceptEntity | null>;

  /** Case-insensitive, incluye eliminados; devuelve primero el activo si lo hay. */
  findByName(tenantId: string, name: string): Promise<ExpenseConceptEntity | null>;

  save(concept: ExpenseConceptEntity): Promise<ExpenseConceptEntity>;

  update(concept: ExpenseConceptEntity): Promise<ExpenseConceptEntity>;

  /** Baja lógica: conserva la fila para que los ítems de gasto pasados la sigan referenciando. */
  deactivate(id: string, tenantId: string): Promise<void>;
}
