import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderStatus, OrderType } from '@pos/shared';
import { EditOrderUseCase } from './edit-order.use-case';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { CustomerRepositoryPort } from '../../../customers/domain/ports/customer-repository.port';
import { Customer } from '../../../customers/domain/entities/customer.entity';
import { Order } from '../../domain/entities/order.entity';
import { RaffleAutoTicketService } from '../../../raffles/application/services/raffle-auto-ticket.service';

const TENANT_ID = 'tenant-1';
const CREATED_AT = new Date('2026-10-18T15:00:00Z');

function makeOrder(customerId: string | null = null): Order {
  return Order.reconstitute({
    id: 'order-1', tenantId: TENANT_ID, branchId: 'branch-1', orderNumber: 1, type: OrderType.DINE_IN,
    status: OrderStatus.PENDING, paymentMethod: null, payments: [],
    items: [{ id: 'i1', orderId: 'order-1', productId: 'prod-1', productName: 'Burger', unitPrice: 50, quantity: 2, subtotal: 100 }],
    subtotal: 100, total: 100, notes: null, createdBy: 'user-1', customerId, createdAt: CREATED_AT, updatedAt: CREATED_AT,
  });
}

function makeCustomer(id: string): Customer {
  return Customer.reconstitute({ id, tenantId: TENANT_ID, name: 'Ana', phone: null, email: null, notes: null, createdAt: new Date(), updatedAt: new Date() });
}

describe('EditOrderUseCase', () => {
  let useCase: EditOrderUseCase;
  let orderRepo: MockProxy<OrderRepositoryPort>;
  let customerRepo: MockProxy<CustomerRepositoryPort>;
  let raffleAutoTicket: MockProxy<RaffleAutoTicketService>;

  beforeEach(() => {
    orderRepo        = mock<OrderRepositoryPort>();
    customerRepo     = mock<CustomerRepositoryPort>();
    raffleAutoTicket = mock<RaffleAutoTicketService>();
    useCase          = new EditOrderUseCase(orderRepo, customerRepo, undefined, raffleAutoTicket);

    orderRepo.findById.mockResolvedValue(makeOrder());
    orderRepo.update.mockImplementation(async (order) => order);
    raffleAutoTicket.syncOrder.mockResolvedValue();
  });

  it('lanza NotFoundException si el pedido no existe', async () => {
    orderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('order-1', TENANT_ID, { customerId: 'c1' })).rejects.toThrow(NotFoundException);
  });

  it('rechaza un cliente que no es del negocio y no toca el pedido', async () => {
    customerRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('order-1', TENANT_ID, { customerId: 'ajeno' })).rejects.toThrow(BadRequestException);
    expect(customerRepo.findById).toHaveBeenCalledWith('ajeno', TENANT_ID);
    expect(orderRepo.update).not.toHaveBeenCalled();
    expect(raffleAutoTicket.syncOrder).not.toHaveBeenCalled();
  });

  it('asignar un cliente al pedido concilia sus tickets con ese cliente', async () => {
    customerRepo.findById.mockResolvedValue(makeCustomer('c1'));

    await useCase.execute('order-1', TENANT_ID, { customerId: 'c1' });

    expect(raffleAutoTicket.syncOrder).toHaveBeenCalledWith(TENANT_ID, expect.objectContaining({ orderId: 'order-1', customerId: 'c1', awardsTickets: true }));
  });

  it('quitar el cliente concilia con customerId null (retira sus tickets)', async () => {
    orderRepo.findById.mockResolvedValue(makeOrder('c1'));

    await useCase.execute('order-1', TENANT_ID, { customerId: null });

    expect(raffleAutoTicket.syncOrder).toHaveBeenCalledWith(TENANT_ID, expect.objectContaining({ customerId: null }));
  });

  it('editar solo las notas no toca los tickets', async () => {
    await useCase.execute('order-1', TENANT_ID, { notes: 'Sin cebolla' });

    expect(raffleAutoTicket.syncOrder).not.toHaveBeenCalled();
  });
});
