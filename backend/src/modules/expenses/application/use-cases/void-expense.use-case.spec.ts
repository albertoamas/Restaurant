import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { VoidExpenseUseCase } from './void-expense.use-case';

describe('VoidExpenseUseCase', () => {
  let repo: MockProxy<ExpenseRepositoryPort>;
  let useCase: VoidExpenseUseCase;

  beforeEach(() => {
    repo    = mock<ExpenseRepositoryPort>();
    useCase = new VoidExpenseUseCase(repo);
  });

  it('anula el gasto del tenant con el motivo sin espacios', async () => {
    repo.void.mockResolvedValue(true);

    await useCase.execute('exp-1', 'tenant-1', 'user-1', '  duplicado ');

    expect(repo.void).toHaveBeenCalledWith('exp-1', 'tenant-1', 'user-1', 'duplicado');
  });

  it('lanza NotFoundException si no existe, es de otro tenant o ya estaba anulado', async () => {
    repo.void.mockResolvedValue(false);

    await expect(useCase.execute('exp-1', 'tenant-1', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
