import { mock, MockProxy } from 'jest-mock-extended';
import { GetReportByRangeUseCase } from './get-report-by-range.use-case';
import { OrderRepositoryPort, DailyReportResult } from '../../../orders/domain/ports/order-repository.port';

describe('GetReportByRangeUseCase', () => {
  let useCase: GetReportByRangeUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;
  const FROM = '2026-09-29T04:00:00.000Z';
  const TO   = '2026-09-30T03:59:59.999Z';

  beforeEach(() => {
    orderRepo = mock<OrderRepositoryPort>();
    useCase   = new GetReportByRangeUseCase(orderRepo);
    orderRepo.getReportByRange.mockResolvedValue({} as DailyReportResult);
  });

  it('la rendición de un cajero filtra por los pedidos que tomó', async () => {
    await useCase.execute('tenant-1', 'branch-1', FROM, TO, 'cashier-1');

    expect(orderRepo.getReportByRange).toHaveBeenCalledWith('tenant-1', 'branch-1', FROM, TO, 'cashier-1');
  });

  it('sin usuario (dueño) cuenta toda la sucursal', async () => {
    await useCase.execute('tenant-1', 'branch-1', FROM, TO);

    expect(orderRepo.getReportByRange).toHaveBeenCalledWith('tenant-1', 'branch-1', FROM, TO, undefined);
  });
});
