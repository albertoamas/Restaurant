import { mock, MockProxy } from 'jest-mock-extended';
import { ListExpensesUseCase, MAX_EXPENSES_PER_PAGE } from './list-expenses.use-case';
import { ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { Expense } from '../../domain/entities/expense.entity';

describe('ListExpensesUseCase', () => {
  let useCase: ListExpensesUseCase;
  let repo: MockProxy<ExpenseRepositoryPort>;
  const from = new Date('2026-09-01T04:00:00Z');
  const to   = new Date('2026-10-01T03:59:59Z');

  beforeEach(() => {
    repo = mock<ExpenseRepositoryPort>();
    useCase = new ListExpensesUseCase(repo);
    repo.findAll.mockResolvedValue([{} as Expense, {} as Expense]);
    repo.findPage.mockResolvedValue({ data: [], total: 0 });
  });

  it('sin limit devuelve todo el período, como antes', async () => {
    const result = await useCase.execute('t1', 'b1', from, to);
    expect(repo.findAll).toHaveBeenCalledWith('t1', 'b1', from, to);
    expect(result.total).toBe(2);
  });

  it('con limit pagina y pasa los filtros ya limpios', async () => {
    await useCase.execute('t1', null, from, to, { limit: 30, page: 2, category: ' Insumos ', q: '  ' });
    expect(repo.findPage).toHaveBeenCalledWith('t1', null, from, to, { category: 'Insumos', q: undefined, page: 2, limit: 30 });
  });

  it('acota limit y corrige una página inválida', async () => {
    await useCase.execute('t1', null, from, to, { limit: 5000, page: NaN });
    expect(repo.findPage).toHaveBeenCalledWith('t1', null, from, to, expect.objectContaining({ limit: MAX_EXPENSES_PER_PAGE, page: 1 }));
  });
});
