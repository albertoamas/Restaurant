import { ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UpdateExpenseConceptUseCase } from './update-expense-concept.use-case';
import { ExpenseConceptRepositoryPort } from '../../domain/ports/expense-concept-repository.port';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';

const TENANT = 'tenant-1';
const CATEGORY_ID = 'cat-1';

function makeConcept(): ExpenseConceptEntity {
  return ExpenseConceptEntity.create({
    tenantId: TENANT, categoryId: CATEGORY_ID, name: 'Carne', unit: 'kg',
    defaultUnitPrice: 35, sortOrder: 10,
  });
}

describe('UpdateExpenseConceptUseCase', () => {
  let useCase: UpdateExpenseConceptUseCase;
  let repo: MockProxy<ExpenseConceptRepositoryPort>;
  let categoryRepo: MockProxy<ExpenseCategoryRepositoryPort>;

  beforeEach(() => {
    repo         = mock<ExpenseConceptRepositoryPort>();
    categoryRepo = mock<ExpenseCategoryRepositoryPort>();
    useCase      = new UpdateExpenseConceptUseCase(repo, categoryRepo);
    repo.findById.mockResolvedValue(makeConcept());
    repo.findByName.mockResolvedValue(null);
    repo.update.mockImplementation(async (c) => c);
    categoryRepo.findById.mockResolvedValue(
      ExpenseCategoryEntity.create({ tenantId: TENANT, name: 'Insumos', icon: null, trackQuantity: true, sortOrder: 0 }),
    );
  });

  it('renombra el concepto conservando lo no enviado', async () => {
    const result = await useCase.execute('c1', TENANT, { name: 'Carne molida' });

    expect(result.name).toBe('Carne molida');
    expect(result.unit).toBe('kg');
    expect(result.defaultUnitPrice).toBe(35);
  });

  it('limpia unidad y precio cuando llegan vacíos o null', async () => {
    const result = await useCase.execute('c1', TENANT, { unit: '', defaultUnitPrice: null });

    expect(result.unit).toBeNull();
    expect(result.defaultUnitPrice).toBeNull();
  });

  it('lanza NotFoundException si el concepto no es del tenant', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('c1', TENANT, { name: 'X' })).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza ConflictException si el nombre ya lo usa otro concepto', async () => {
    repo.findByName.mockResolvedValue(
      ExpenseConceptEntity.reconstitute({
        id: 'otro', tenantId: TENANT, categoryId: CATEGORY_ID, name: 'Pollo', unit: null,
        defaultUnitPrice: null, isActive: true, sortOrder: 0, createdAt: new Date(),
      }),
    );
    await expect(useCase.execute('c1', TENANT, { name: 'Pollo' })).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si la categoría destino no existe', async () => {
    categoryRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('c1', TENANT, { categoryId: 'cat-ajena' }),
    ).rejects.toThrow(NotFoundException);
  });
});
