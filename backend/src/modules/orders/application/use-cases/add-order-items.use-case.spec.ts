import { mock, MockProxy } from 'jest-mock-extended';
import { OrderStatus, OrderType, UserRole } from '@pos/shared';
import { AddOrderItemsUseCase } from './add-order-items.use-case';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { Order } from '../../domain/entities/order.entity';
import { Product } from '../../../catalog/domain/entities/product.entity';
import { RaffleAutoTicketService } from '../../../raffles/application/services/raffle-auto-ticket.service';
import { AddOrderItemsDto } from '../dto/add-order-items.dto';

const TENANT_ID = 'tenant-1';
const CREATED_AT = new Date('2026-10-18T15:00:00Z');

function makeOrder(customerId: string | null): Order {
  return Order.reconstitute({
    id: 'order-1', tenantId: TENANT_ID, branchId: 'branch-1', orderNumber: 1, type: OrderType.DINE_IN,
    status: OrderStatus.PREPARING, paymentMethod: null, payments: [],
    items: [{ id: 'i1', orderId: 'order-1', productId: 'prod-1', productName: 'Burger', unitPrice: 50, quantity: 1, subtotal: 50 }],
    subtotal: 50, total: 50, notes: null, createdBy: 'user-1', customerId, createdAt: CREATED_AT, updatedAt: CREATED_AT,
  });
}

const PRODUCT = Product.reconstitute({
  id: 'prod-2', tenantId: TENANT_ID, categoryId: 'cat-1', name: 'Milanesa', price: 60,
  imageUrl: null, isActive: true, createdAt: new Date(),
});

const DTO = { items: [{ productId: 'prod-2', quantity: 2 }] } as AddOrderItemsDto;

describe('AddOrderItemsUseCase: tickets de sorteo', () => {
  let useCase: AddOrderItemsUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;
  let productRepo: MockProxy<ProductRepositoryPort>;
  let raffleAutoTicket: MockProxy<RaffleAutoTicketService>;

  beforeEach(() => {
    orderRepo        = mock<OrderRepositoryPort>();
    productRepo      = mock<ProductRepositoryPort>();
    raffleAutoTicket = mock<RaffleAutoTicketService>();
    useCase = new AddOrderItemsUseCase(orderRepo, productRepo, mock<CashSessionRepositoryPort>(), undefined, raffleAutoTicket);

    productRepo.findByIds.mockResolvedValue([PRODUCT]);
    orderRepo.addItems.mockImplementation(async (id, tenantId, items, total) => {
      const base = makeOrder('cust-1');
      return Order.reconstitute({ ...base, items, subtotal: total, total, payments: [], customer: null });
    });
    raffleAutoTicket.syncOrder.mockResolvedValue();
  });

  it('concilia con el pedido ya ampliado: los productos agregados también dan tickets', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder('cust-1'));

    await useCase.execute(TENANT_ID, 'order-1', UserRole.CASHIER, DTO);

    expect(raffleAutoTicket.syncOrder).toHaveBeenCalledWith(TENANT_ID, expect.objectContaining({
      orderId: 'order-1',
      customerId: 'cust-1',
      total: 170,
      awardsTickets: true,
      items: [{ productId: 'prod-1', quantity: 1 }, { productId: 'prod-2', quantity: 2 }],
    }));
  });

  it('un pedido sin cliente no tiene a quién darle tickets: no concilia', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder(null));
    orderRepo.addItems.mockImplementation(async (id, tenantId, items, total) =>
      Order.reconstitute({ ...makeOrder(null), items, subtotal: total, total, payments: [], customer: null }));

    await useCase.execute(TENANT_ID, 'order-1', UserRole.CASHIER, DTO);

    expect(raffleAutoTicket.syncOrder).not.toHaveBeenCalled();
  });
});
