import { ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CreateExpenseConceptUseCase } from './create-expense-concept.use-case';
import { ExpenseConceptRepositoryPort } from '../../domain/ports/expense-concept-repository.port';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';

const TENANT = 'tenant-1';
const CATEGORY_ID = 'cat-1';

function makeCategory(): ExpenseCategoryEntity {
  return ExpenseCategoryEntity.create({
    tenantId: TENANT, name: 'Insumos', icon: null, trackQuantity: true, sortOrder: 0,
  });
}

function makeConcept(isActive: boolean): ExpenseConceptEntity {
  const concept = ExpenseConceptEntity.create({
    tenantId: TENANT, categoryId: CATEGORY_ID, name: 'Carne', unit: 'kg',
    defaultUnitPrice: null, sortOrder: 0,
  });
  return isActive ? concept : concept.withChanges({ isActive: false });
}

describe('CreateExpenseConceptUseCase', () => {
  let useCase: CreateExpenseConceptUseCase;
  let repo: MockProxy<ExpenseConceptRepositoryPort>;
  let categoryRepo: MockProxy<ExpenseCategoryRepositoryPort>;

  beforeEach(() => {
    repo         = mock<ExpenseConceptRepositoryPort>();
    categoryRepo = mock<ExpenseCategoryRepositoryPort>();
    useCase      = new CreateExpenseConceptUseCase(repo, categoryRepo);
    categoryRepo.findById.mockResolvedValue(makeCategory());
    repo.findByName.mockResolvedValue(null);
    repo.save.mockImplementation(async (c) => c);
    repo.update.mockImplementation(async (c) => c);
  });

  it('crea un concepto nuevo con su unidad y precio sugerido', async () => {
    const result = await useCase.execute(TENANT, {
      categoryId: CATEGORY_ID, name: '  Carne  ', unit: 'kg', defaultUnitPrice: 35,
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Carne');
    expect(result.unit).toBe('kg');
    expect(result.defaultUnitPrice).toBe(35);
    expect(result.categoryName).toBe('Insumos');
  });

  it('lanza NotFoundException si la categoría no es del tenant', async () => {
    categoryRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(TENANT, { categoryId: 'ajeno', name: 'Carne' }),
    ).rejects.toThrow(NotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lanza ConflictException si ya existe uno activo con ese nombre', async () => {
    repo.findByName.mockResolvedValue(makeConcept(true));
    await expect(
      useCase.execute(TENANT, { categoryId: CATEGORY_ID, name: 'carne' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('reactiva el concepto dado de baja en vez de chocar con el índice único', async () => {
    repo.findByName.mockResolvedValue(makeConcept(false));

    const result = await useCase.execute(TENANT, {
      categoryId: CATEGORY_ID, name: 'Carne', unit: 'kg',
    });

    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(result.isActive).toBe(true);
  });

  it('guarda unidad y precio como null cuando vienen vacíos', async () => {
    const result = await useCase.execute(TENANT, {
      categoryId: CATEGORY_ID, name: 'Alquiler', unit: '   ',
    });

    expect(result.unit).toBeNull();
    expect(result.defaultUnitPrice).toBeNull();
  });
});
