import { OrderStatus, PaymentMethod } from '@pos/shared';
import { OrderTicketSnapshot } from '../../raffles/domain/entities/raffle.entity';
import { Order } from '../domain/entities/order.entity';

/**
 * Lo que el pedido otorga hoy a efectos de sorteos. Un pedido cancelado, o cobrado entero como
 * cortesía, no da tickets; si solo una parte fue cortesía (productos agregados después), sí.
 */
export function toRaffleTicketSnapshot(order: Order): OrderTicketSnapshot {
  const fullyComplimentary =
    order.payments.length > 0 && order.payments.every((p) => p.method === PaymentMethod.CORTESIA);

  return {
    orderId: order.id,
    customerId: order.customerId,
    total: order.total,
    items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    createdAt: order.createdAt,
    awardsTickets: order.status !== OrderStatus.CANCELLED && !fullyComplimentary,
  };
}
