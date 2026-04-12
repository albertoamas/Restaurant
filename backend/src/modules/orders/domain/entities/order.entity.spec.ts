import { OrderType, OrderStatus, PaymentMethod } from '@pos/shared';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderPayment } from './order-payment.entity';

function makeItem(): OrderItem {
  return OrderItem.create({
    orderId:     'order-1',
    productId:   'prod-1',
    productName: 'Hamburguesa',
    quantity:    2,
    unitPrice:   30,
  });
}

function makeOrder(overrides: Partial<Parameters<typeof Order.create>[0]> = {}): Order {
  return Order.create({
    tenantId:      'tenant-1',
    branchId:      'branch-1',
    orderNumber:   1,
    type:          OrderType.DINE_IN,
    paymentMethod: null,
    payments:      [],
    items:         [makeItem()],
    createdBy:     'user-1',
    ...overrides,
  });
}

describe('Order entity', () => {
  describe('create()', () => {
    it('construye la entidad con los campos correctos', () => {
      const order = makeOrder();
      expect(order.tenantId).toBe('tenant-1');
      expect(order.branchId).toBe('branch-1');
      expect(order.orderNumber).toBe(1);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.total).toBe(60); // 2 × 30
    });
  });

  describe('updateStatus() — transiciones válidas', () => {
    it('PENDING → PREPARING', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.PREPARING);
      expect(order.status).toBe(OrderStatus.PREPARING);
    });

    it('PREPARING → DELIVERED', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.PREPARING);
      order.updateStatus(OrderStatus.DELIVERED);
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it('PENDING → CANCELLED', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.CANCELLED);
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('PREPARING → CANCELLED', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.PREPARING);
      order.updateStatus(OrderStatus.CANCELLED);
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('updateStatus() — transiciones inválidas', () => {
    it('DELIVERED → PREPARING lanza excepción', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.PREPARING);
      order.updateStatus(OrderStatus.DELIVERED);
      expect(() => order.updateStatus(OrderStatus.PREPARING)).toThrow();
    });

    it('PREPARING → PENDING lanza excepción (no hay marcha atrás)', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.PREPARING);
      expect(() => order.updateStatus(OrderStatus.PENDING)).toThrow();
    });

    it('CANCELLED → cualquier estado lanza excepción', () => {
      const order = makeOrder();
      order.updateStatus(OrderStatus.CANCELLED);
      expect(() => order.updateStatus(OrderStatus.PENDING)).toThrow();
      expect(() => order.updateStatus(OrderStatus.PREPARING)).toThrow();
    });
  });
});
