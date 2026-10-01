import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { EXPENSE_CATALOG_LIMITS, SUGGESTED_EXPENSE_CATALOG } from '@pos/shared';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { ExpenseConceptRepositoryPort } from '../../domain/ports/expense-concept-repository.port';
import { LoadSuggestedExpenseCatalogUseCase } from './load-suggested-expense-catalog.use-case';

const TENANT = 'tenant-1';
const SERVICIOS = SUGGESTED_EXPENSE_CATALOG.find((g) => g.name === 'Servicios')!;

function category(name: string, isActive = true): ExpenseCategoryEntity {
  const c = ExpenseCategoryEntity.create({ tenantId: TENANT, name, icon: null, trackQuantity: false, sortOrder: 10 });
  return isActive ? c : c.withChanges({ isActive: false });
}

function concept(name: string, isActive = true): ExpenseConceptEntity {
  const c = ExpenseConceptEntity.create({ tenantId: TENANT, categoryId: 'cat-x', name, unit: null, defaultUnitPrice: null, sortOrder: 10 });
  return isActive ? c : c.withChanges({ isActive: false });
}

describe('LoadSuggestedExpenseCatalogUseCase', () => {
  let categories: MockProxy<ExpenseCategoryRepositoryPort>;
  let concepts: MockProxy<ExpenseConceptRepositoryPort>;
  let useCase: LoadSuggestedExpenseCatalogUseCase;

  beforeEach(() => {
    categories = mock<ExpenseCategoryRepositoryPort>();
    concepts   = mock<ExpenseConceptRepositoryPort>();
    categories.findByName.mockResolvedValue(null);
    concepts.findByName.mockResolvedValue(null);
    categories.findAll.mockResolvedValue([]);
    concepts.findAll.mockResolvedValue([]);
    categories.save.mockImplementation(async (c) => c);
    categories.update.mockImplementation(async (c) => c);
    concepts.save.mockImplementation(async (c) => c);
    concepts.update.mockImplementation(async (c) => c);
    useCase = new LoadSuggestedExpenseCatalogUseCase(categories, concepts);
  });

  it('crea solo las categorías elegidas, con sus gastos', async () => {
    const result = await useCase.execute(TENANT, ['Servicios']);

    expect(result).toEqual({ categories: 1, concepts: SERVICIOS.concepts.length });
    expect(categories.save).toHaveBeenCalledTimes(1);
    expect(categories.save.mock.calls[0][0].name).toBe('Servicios');
    expect(concepts.save.mock.calls.map(([c]) => c.name)).toEqual(SERVICIOS.concepts.map(([n]) => n));
    expect(concepts.save.mock.calls.every(([c]) => c.tenantId === TENANT)).toBe(true);
  });

  it('rechaza una categoría que no está en el catálogo', async () => {
    await expect(useCase.execute(TENANT, ['Servicios', 'Inventada'])).rejects.toThrow(BadRequestException);
    expect(categories.save).not.toHaveBeenCalled();
  });

  it('no duplica lo que ya existe activo', async () => {
    const existing = category('Servicios');
    categories.findByName.mockResolvedValue(existing);
    concepts.findByName.mockImplementation(async (_t, name) => (name === 'Luz' ? concept('Luz') : null));

    const result = await useCase.execute(TENANT, ['Servicios']);

    expect(categories.save).not.toHaveBeenCalled();
    expect(result).toEqual({ categories: 0, concepts: SERVICIOS.concepts.length - 1 });
    expect(concepts.save.mock.calls.map(([c]) => c.name)).not.toContain('Luz');
    expect(concepts.save.mock.calls.every(([c]) => c.categoryId === existing.id)).toBe(true);
  });

  it('reactiva una categoría y un gasto eliminados en vez de chocar con el nombre', async () => {
    categories.findByName.mockResolvedValue(category('Servicios', false));
    concepts.findByName.mockImplementation(async (_t, name) => (name === 'Agua' ? concept('Agua', false) : null));

    await useCase.execute(TENANT, ['Servicios']);

    expect(categories.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Servicios', isActive: true }));
    expect(concepts.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Agua', isActive: true }));
  });

  it('no crea nada si supera el máximo de categorías', async () => {
    categories.findAll.mockResolvedValue(
      Array.from({ length: EXPENSE_CATALOG_LIMITS.categories }, (_, i) => category(`Propia ${i}`)),
    );

    await expect(useCase.execute(TENANT, ['Servicios'])).rejects.toThrow(ForbiddenException);
    expect(categories.save).not.toHaveBeenCalled();
    expect(concepts.save).not.toHaveBeenCalled();
  });

  it('no crea nada si supera el máximo de gastos', async () => {
    concepts.findAll.mockResolvedValue(
      Array.from({ length: EXPENSE_CATALOG_LIMITS.concepts - 1 }, (_, i) => concept(`Propio ${i}`)),
    );

    await expect(useCase.execute(TENANT, ['Servicios'])).rejects.toThrow(ForbiddenException);
    expect(categories.save).not.toHaveBeenCalled();
  });
});
