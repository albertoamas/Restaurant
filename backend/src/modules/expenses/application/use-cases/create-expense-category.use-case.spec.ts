import { BadRequestException, ConflictException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CreateExpenseCategoryUseCase } from './create-expense-category.use-case';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';

const TENANT = 'tenant-1';

function makeCategory(isActive: boolean): ExpenseCategoryEntity {
  const category = ExpenseCategoryEntity.create({
    tenantId: TENANT, name: 'Insumos', icon: '🧂', trackQuantity: true, sortOrder: 10,
  });
  return isActive ? category : category.withChanges({ isActive: false });
}

describe('CreateExpenseCategoryUseCase', () => {
  let useCase: CreateExpenseCategoryUseCase;
  let repo: MockProxy<ExpenseCategoryRepositoryPort>;

  beforeEach(() => {
    repo    = mock<ExpenseCategoryRepositoryPort>();
    useCase = new CreateExpenseCategoryUseCase(repo);
    repo.findByName.mockResolvedValue(null);
    repo.save.mockImplementation(async (c) => c);
    repo.update.mockImplementation(async (c) => c);
  });

  it('crea una categoría nueva recortando el nombre', async () => {
    const result = await useCase.execute(TENANT, { name: '  Delivery  ' });

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Delivery');
    expect(result.isActive).toBe(true);
  });

  it('lanza BadRequestException si el nombre viene vacío', async () => {
    await expect(useCase.execute(TENANT, { name: '   ' })).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lanza ConflictException si ya existe una activa con ese nombre', async () => {
    repo.findByName.mockResolvedValue(makeCategory(true));
    await expect(useCase.execute(TENANT, { name: 'insumos' })).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('reactiva la categoría eliminada en vez de chocar con el índice único', async () => {
    repo.findByName.mockResolvedValue(makeCategory(false));

    const result = await useCase.execute(TENANT, { name: 'Insumos' });

    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(result.isActive).toBe(true);
    expect(result.name).toBe('Insumos');
  });
});
