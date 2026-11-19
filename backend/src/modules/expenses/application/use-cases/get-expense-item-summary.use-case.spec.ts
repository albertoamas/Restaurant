import { mock, MockProxy } from 'jest-mock-extended';
import { ExpenseItemSummaryDto } from '@pos/shared';
import { GetExpenseItemSummaryUseCase } from './get-expense-item-summary.use-case';
import { ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';

const row = (name: string, total: number): ExpenseItemSummaryDto => ({
  category: 'Insumos', conceptId: null, name, unit: null, quantity: 1, total, purchases: 1,
});

describe('GetExpenseItemSummaryUseCase', () => {
  let useCase: GetExpenseItemSummaryUseCase;
  let repo: MockProxy<ExpenseRepositoryPort>;
  const from = new Date('2026-10-01T04:00:00Z');
  const to   = new Date('2026-11-01T03:59:59Z');

  beforeEach(() => {
    repo = mock<ExpenseRepositoryPort>();
    useCase = new GetExpenseItemSummaryUseCase(repo);
  });

  it('pasa tenant, sucursal y período al repositorio', async () => {
    repo.getItemSummary.mockResolvedValue([]);
    await useCase.execute('t1', 'b1', from, to);
    expect(repo.getItemSummary).toHaveBeenCalledWith('t1', 'b1', from, to);
  });

  it('ordena de mayor a menor gasto', async () => {
    repo.getItemSummary.mockResolvedValue([row('Aceite', 216), row('Carne', 2016), row('Pollo', 795)]);
    const result = await useCase.execute('t1', null, from, to);
    expect(result.map((r) => r.name)).toEqual(['Carne', 'Pollo', 'Aceite']);
  });
});
