import { OrderType, OrderStatus, PaymentMethod } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderItemOrmEntity } from './order-item.orm-entity';

export class OrderMapper {
  static toDomain(orm: OrderOrmEntity): Order {
    const items: OrderItem[] = (orm.items ?? []).map((itemOrm) =>
      OrderItem.reconstitute({
        id: itemOrm.id,
        orderId: itemOrm.order_id,
        productId: itemOrm.product_id,
        productName: itemOrm.product_name,
        quantity: itemOrm.quantity,
        unitPrice: Number(itemOrm.unit_price),
        subtotal: Number(itemOrm.subtotal),
      }),
    );

    return Order.reconstitute({
      id: orm.id,
      tenantId: orm.tenant_id,
      orderNumber: orm.order_number,
      type: orm.type as OrderType,
      status: orm.status as OrderStatus,
      paymentMethod: orm.payment_method as PaymentMethod,
      items,
      subtotal: Number(orm.subtotal),
      total: Number(orm.total),
      notes: orm.notes,
      createdBy: orm.created_by,
      createdAt: orm.created_at,
      updatedAt: orm.updated_at,
    });
  }

  static toOrm(domain: Order): OrderOrmEntity {
    const orm = new OrderOrmEntity();

    orm.id = domain.id;
    orm.tenant_id = domain.tenantId;
    orm.order_number = domain.orderNumber;
    orm.type = domain.type;
    orm.status = domain.status;
    orm.payment_method = domain.paymentMethod;
    orm.subtotal = domain.subtotal;
    orm.total = domain.total;
    orm.notes = domain.notes;
    orm.created_by = domain.createdBy;
    orm.created_at = domain.createdAt;
    orm.updated_at = domain.updatedAt;

    orm.items = domain.items.map((item) => {
      const itemOrm = new OrderItemOrmEntity();
      itemOrm.id = item.id;
      itemOrm.order_id = item.orderId;
      itemOrm.product_id = item.productId;
      itemOrm.product_name = item.productName;
      itemOrm.quantity = item.quantity;
      itemOrm.unit_price = item.unitPrice;
      itemOrm.subtotal = item.subtotal;
      return itemOrm;
    });

    return orm;
  }
}
