import { mock, MockProxy } from 'jest-mock-extended';
import { ListOrdersUseCase } from './list-orders.use-case';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { Order } from '../../domain/entities/order.entity';

const TENANT_ID = 'tenant-1';

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;

  beforeEach(() => {
    orderRepo = mock<OrderRepositoryPort>();
    useCase   = new ListOrdersUseCase(orderRepo);
    orderRepo.findAll.mockResolvedValue({ data: [], total: 0 });
  });

  it('pasa tenantId y filtros al repositorio', async () => {
    await useCase.execute(TENANT_ID, { page: 2, limit: 10 });
    expect(orderRepo.findAll).toHaveBeenCalledWith(TENANT_ID, { page: 2, limit: 10 });
  });

  it('retorna data y total del repositorio', async () => {
    const mockOrders = [{ id: 'o1' } as unknown as Order];
    orderRepo.findAll.mockResolvedValue({ data: mockOrders, total: 1 });

    const result = await useCase.execute(TENANT_ID);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('pasa branchId en los filtros cuando se especifica (CASHIER)', async () => {
    await useCase.execute(TENANT_ID, { branchId: 'branch-1' });
    const [, filters] = orderRepo.findAll.mock.calls[0];
    expect(filters?.branchId).toBe('branch-1');
  });

  it('no incluye branchId cuando no se especifica (OWNER ve todas las sucursales)', async () => {
    await useCase.execute(TENANT_ID, {});
    const [, filters] = orderRepo.findAll.mock.calls[0];
    expect(filters?.branchId).toBeUndefined();
  });

  it('funciona con filtros vacíos por defecto', async () => {
    await useCase.execute(TENANT_ID);
    expect(orderRepo.findAll).toHaveBeenCalledWith(TENANT_ID, {});
  });
});
