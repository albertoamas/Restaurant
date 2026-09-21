import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UpdateExpenseCategoryUseCase } from './update-expense-category.use-case';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';

const TENANT = 'tenant-1';

function makeCategory(name = 'Insumos'): ExpenseCategoryEntity {
  return ExpenseCategoryEntity.create({
    tenantId: TENANT, name, icon: '🧂', trackQuantity: true, sortOrder: 10,
  });
}

describe('UpdateExpenseCategoryUseCase', () => {
  let useCase: UpdateExpenseCategoryUseCase;
  let repo: MockProxy<ExpenseCategoryRepositoryPort>;

  beforeEach(() => {
    repo    = mock<ExpenseCategoryRepositoryPort>();
    useCase = new UpdateExpenseCategoryUseCase(repo);
    repo.findById.mockResolvedValue(makeCategory());
    repo.findByName.mockResolvedValue(null);
    repo.update.mockImplementation(async (c) => c);
  });

  it('renombra la categoría conservando lo no enviado', async () => {
    const result = await useCase.execute('c1', TENANT, { name: '  Insumos secos  ' });

    expect(result.name).toBe('Insumos secos');
    expect(result.icon).toBe('🧂');
    expect(result.sortOrder).toBe(10);
  });

  it('lanza NotFoundException si la categoría no es del tenant', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('c1', TENANT, { name: 'X' })).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException si el nombre queda vacío', async () => {
    await expect(useCase.execute('c1', TENANT, { name: '   ' })).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza ConflictException si otra categoría ya usa ese nombre', async () => {
    repo.findByName.mockResolvedValue(
      ExpenseCategoryEntity.reconstitute({
        id: 'otra', tenantId: TENANT, name: 'Servicios', icon: null,
        isActive: true, trackQuantity: false, sortOrder: 0, createdAt: new Date(),
      }),
    );
    await expect(useCase.execute('c1', TENANT, { name: 'Servicios' })).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('permite guardar con el mismo nombre que ya tenía', async () => {
    const same = makeCategory();
    repo.findById.mockResolvedValue(same);
    repo.findByName.mockResolvedValue(same);

    await expect(useCase.execute(same.id, TENANT, { name: 'Insumos' })).resolves.toBeDefined();
    expect(repo.update).toHaveBeenCalledTimes(1);
  });
});
