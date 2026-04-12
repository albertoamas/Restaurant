import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderStatus, OrderType, PaymentMethod } from '@pos/shared';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { EventsService } from '../../../events/events.service';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';

function makeOrder(status: OrderStatus = OrderStatus.PENDING): Order {
  const order = Order.create({
    tenantId:      'tenant-1',
    branchId:      'branch-1',
    orderNumber:   1,
    type:          OrderType.DINE_IN,
    paymentMethod: null,
    payments:      [],
    items: [OrderItem.create({ orderId: 'o1', productId: 'p1', productName: 'Burger', quantity: 1, unitPrice: 30 })],
    createdBy: 'user-1',
  });
  // Advance to desired status without going through the entity API
  (order as any).status = status;
  return order;
}

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;
  let eventsService: MockProxy<EventsService>;

  beforeEach(() => {
    orderRepo     = mock<OrderRepositoryPort>();
    eventsService = mock<EventsService>();
    useCase       = new UpdateOrderStatusUseCase(orderRepo, eventsService);
    orderRepo.save.mockImplementation(async (o) => o);
  });

  it('actualiza a PREPARING y emite evento order.updated', async () => {
    const order = makeOrder(OrderStatus.PENDING);
    orderRepo.findById.mockResolvedValue(order);

    const result = await useCase.execute(order.id, 'tenant-1', OrderStatus.PREPARING);

    expect(result.status).toBe(OrderStatus.PREPARING);
    expect(eventsService.emitToTenant).toHaveBeenCalledWith('tenant-1', 'order.updated', result);
  });

  it('actualiza a DELIVERED y emite evento', async () => {
    const order = makeOrder(OrderStatus.PREPARING);
    orderRepo.findById.mockResolvedValue(order);

    const result = await useCase.execute(order.id, 'tenant-1', OrderStatus.DELIVERED);
    expect(result.status).toBe(OrderStatus.DELIVERED);
    expect(eventsService.emitToTenant).toHaveBeenCalledTimes(1);
  });

  it('actualiza a CANCELLED y emite evento', async () => {
    const order = makeOrder(OrderStatus.PENDING);
    orderRepo.findById.mockResolvedValue(order);

    const result = await useCase.execute(order.id, 'tenant-1', OrderStatus.CANCELLED);
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  it('lanza NotFoundException si el pedido no existe', async () => {
    orderRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('unknown-id', 'tenant-1', OrderStatus.PREPARING))
      .rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException en transición inválida (DELIVERED → PREPARING)', async () => {
    const order = makeOrder(OrderStatus.DELIVERED);
    orderRepo.findById.mockResolvedValue(order);
    await expect(useCase.execute(order.id, 'tenant-1', OrderStatus.PREPARING))
      .rejects.toThrow(BadRequestException);
  });
});
