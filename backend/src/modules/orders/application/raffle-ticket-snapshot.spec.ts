import { OrderStatus, OrderType, PaymentMethod } from '@pos/shared';
import { Order } from '../domain/entities/order.entity';
import { toRaffleTicketSnapshot } from './raffle-ticket-snapshot';

const CREATED_AT = new Date('2026-10-18T15:00:00Z');

function makeOrder(overrides: { status?: OrderStatus; customerId?: string | null; payments?: PaymentMethod[] } = {}): Order {
  return Order.reconstitute({
    id: 'order-1', tenantId: 'tenant-1', branchId: 'branch-1', orderNumber: 1, type: OrderType.DINE_IN,
    status: overrides.status ?? OrderStatus.PENDING, paymentMethod: null,
    payments: (overrides.payments ?? []).map((method, i) => ({ id: `p${i}`, orderId: 'order-1', tenantId: 'tenant-1', method, amount: 50 })),
    items: [
      { id: 'i1', orderId: 'order-1', productId: 'prod-1', productName: 'Burger', unitPrice: 50, quantity: 2, subtotal: 100 },
      { id: 'i2', orderId: 'order-1', productId: 'prod-2', productName: 'Soda', unitPrice: 20, quantity: 1, subtotal: 20 },
    ],
    subtotal: 120, total: 120, notes: null, createdBy: 'user-1',
    customerId: overrides.customerId === undefined ? 'cust-1' : overrides.customerId,
    createdAt: CREATED_AT, updatedAt: CREATED_AT,
  });
}

describe('toRaffleTicketSnapshot()', () => {
  it('copia lo que importa al sorteo: pedido, cliente, total, líneas y fecha', () => {
    expect(toRaffleTicketSnapshot(makeOrder())).toEqual({
      orderId: 'order-1', customerId: 'cust-1', total: 120, createdAt: CREATED_AT, awardsTickets: true,
      items: [{ productId: 'prod-1', quantity: 2 }, { productId: 'prod-2', quantity: 1 }],
    });
  });

  it('un pedido sin cobrar da tickets', () => {
    expect(toRaffleTicketSnapshot(makeOrder({ payments: [] })).awardsTickets).toBe(true);
  });

  it('un pedido cancelado no da tickets', () => {
    expect(toRaffleTicketSnapshot(makeOrder({ status: OrderStatus.CANCELLED })).awardsTickets).toBe(false);
  });

  it('un pedido cobrado entero como cortesía no da tickets', () => {
    expect(toRaffleTicketSnapshot(makeOrder({ payments: [PaymentMethod.CORTESIA] })).awardsTickets).toBe(false);
  });

  it('si solo una parte fue cortesía (productos agregados después) sí da tickets', () => {
    expect(toRaffleTicketSnapshot(makeOrder({ payments: [PaymentMethod.QR, PaymentMethod.CORTESIA] })).awardsTickets).toBe(true);
  });

  it('conserva customerId null para que el servicio retire lo que hubiera', () => {
    expect(toRaffleTicketSnapshot(makeOrder({ customerId: null })).customerId).toBeNull();
  });
});
