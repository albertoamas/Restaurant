import { mock, MockProxy } from 'jest-mock-extended';
import { GetDailySeriesByBranchUseCase } from './get-daily-series-by-branch.use-case';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

describe('GetDailySeriesByBranchUseCase', () => {
  let useCase: GetDailySeriesByBranchUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;

  beforeEach(() => {
    orderRepo = mock<OrderRepositoryPort>();
    useCase   = new GetDailySeriesByBranchUseCase(orderRepo);
    orderRepo.getDailySeriesByBranch.mockResolvedValue([]);
  });

  it('pasa el rango pedido al repositorio', async () => {
    await useCase.execute('tenant-1', '2026-09-01T04:00:00.000Z', '2026-09-08T03:59:59.999Z');

    expect(orderRepo.getDailySeriesByBranch).toHaveBeenCalledWith(
      'tenant-1', '2026-09-01T04:00:00.000Z', '2026-09-08T03:59:59.999Z',
    );
  });

  it('sin rango usa el día de hoy en hora Bolivia, no el día UTC', async () => {
    const { start, end } = getBoliviaTodayBoundsISO();

    await useCase.execute('tenant-1');

    expect(orderRepo.getDailySeriesByBranch).toHaveBeenCalledWith('tenant-1', start, end);
  });

  it('devuelve las filas del repositorio sin transformarlas', async () => {
    const rows = [
      { date: '2026-09-01', branchId: 'b1', totalSales: 120, orderCount: 3 },
      { date: '2026-09-01', branchId: 'b2', totalSales: 45,  orderCount: 1 },
    ];
    orderRepo.getDailySeriesByBranch.mockResolvedValue(rows);

    await expect(useCase.execute('tenant-1')).resolves.toEqual(rows);
  });
});
