import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UpdateExpenseUseCase } from './update-expense.use-case';
import { ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { Expense } from '../../domain/entities/expense.entity';

const TENANT = 'tenant-1';
const EXPENSE_ID = 'exp-1';

function makeExpense(status: 'ACTIVE' | 'VOIDED'): Expense {
  const expense = Expense.create({
    tenantId:       TENANT,
    branchId:       'branch-1',
    category:       'Insumos',
    amount:         100,
    description:    null,
    createdBy:      'user-1',
    expenseDate:    new Date('2026-09-21T16:00:00Z'),
    paymentMethod:  null,
    supplierName:   null,
    documentNumber: null,
    cashSessionId:  null,
    items:          [],
  });
  if (status === 'ACTIVE') return expense;

  return Expense.reconstitute({
    ...expense,
    status:     'VOIDED',
    voidedAt:   new Date(),
    voidedBy:   'user-1',
    voidReason: null,
    items:      [],
  });
}

const DTO = {
  items: [{ name: 'Carne', quantity: 2, unitPrice: 50 }],
};

describe('UpdateExpenseUseCase', () => {
  let useCase: UpdateExpenseUseCase;
  let repo: MockProxy<ExpenseRepositoryPort>;
  let categoryRepo: MockProxy<ExpenseCategoryRepositoryPort>;

  beforeEach(() => {
    repo         = mock<ExpenseRepositoryPort>();
    categoryRepo = mock<ExpenseCategoryRepositoryPort>();
    useCase      = new UpdateExpenseUseCase(repo, categoryRepo);
    repo.update.mockImplementation(async () => makeExpense('ACTIVE'));
  });

  it('lanza NotFoundException si el gasto no existe en el tenant', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute(EXPENSE_ID, TENANT, DTO)).rejects.toThrow(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('lanza BadRequestException al editar un gasto anulado', async () => {
    repo.findById.mockResolvedValue(makeExpense('VOIDED'));

    await expect(useCase.execute(EXPENSE_ID, TENANT, DTO)).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('actualiza un gasto activo recalculando el total de los ítems', async () => {
    repo.findById.mockResolvedValue(makeExpense('ACTIVE'));

    await useCase.execute(EXPENSE_ID, TENANT, DTO);

    expect(repo.update).toHaveBeenCalledTimes(1);
    const [, , patch, items] = repo.update.mock.calls[0];
    expect(patch.amount).toBe(100);
    expect(items[0].totalPrice).toBe(100);
  });
});
