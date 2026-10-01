import { describe, it, expect } from 'vitest';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { countOrders } from './useOrderCounts';

const o = (status: OrderStatus) => ({ status } as OrderDto);

describe('countOrders', () => {
  it('cuenta por estado; "todos" incluye cancelados', () => {
    const counts = countOrders([
      o(OrderStatus.PENDING), o(OrderStatus.PENDING), o(OrderStatus.PREPARING),
      o(OrderStatus.DELIVERED), o(OrderStatus.CANCELLED),
    ]);
    expect(counts).toEqual({ all: 5, pending: 2, preparing: 1, delivered: 1 });
  });
});
