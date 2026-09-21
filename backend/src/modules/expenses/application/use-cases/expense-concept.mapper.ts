import { ExpenseConceptDto } from '@pos/shared';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';

export function toExpenseConceptDto(concept: ExpenseConceptEntity, categoryName: string): ExpenseConceptDto {
  return {
    id:               concept.id,
    categoryId:       concept.categoryId,
    categoryName,
    name:             concept.name,
    unit:             concept.unit,
    defaultUnitPrice: concept.defaultUnitPrice,
    isActive:         concept.isActive,
  };
}
