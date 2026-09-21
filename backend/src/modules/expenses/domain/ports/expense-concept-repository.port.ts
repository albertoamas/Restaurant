import { ExpenseConceptEntity } from '../entities/expense-concept.entity';

export const EXPENSE_CONCEPT_REPOSITORY_PORT = 'ExpenseConceptRepositoryPort';

export interface ExpenseConceptRepositoryPort {
  /** Conceptos activos cuya categoría también está activa, ordenados para mostrar. */
  findAll(tenantId: string): Promise<ExpenseConceptEntity[]>;

  findById(id: string, tenantId: string): Promise<ExpenseConceptEntity | null>;

  /** Búsqueda case-insensitive incluyendo inactivos — protege el índice único (tenant, name). */
  findByName(tenantId: string, name: string): Promise<ExpenseConceptEntity | null>;

  count(tenantId: string): Promise<number>;

  save(concept: ExpenseConceptEntity): Promise<ExpenseConceptEntity>;

  update(concept: ExpenseConceptEntity): Promise<ExpenseConceptEntity>;

  /** Baja lógica: conserva la fila para que los ítems de gasto pasados la sigan referenciando. */
  deactivate(id: string, tenantId: string): Promise<void>;

  saveMany(concepts: ExpenseConceptEntity[]): Promise<void>;
}
