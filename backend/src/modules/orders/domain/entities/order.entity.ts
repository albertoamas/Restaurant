import { v4 as uuidv4 } from 'uuid';
import { OrderType, OrderStatus, PaymentMethod } from '@pos/shared';
import { OrderItem } from './order-item.entity';
import { OrderPayment } from './order-payment.entity';

export interface OrderCustomer {
  id: string;
  name: string;
  phone: string | null;
}

export interface OrderProps {
  id: string;
  tenantId: string;
  branchId: string;
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  payments: OrderPayment[];
  items: OrderItem[];
  subtotal: number;
  total: number;
  notes: string | null;
  createdBy: string;
  customerId: string | null;
  customer?: OrderCustomer | null;
  createdAt: Date;
  updatedAt: Date;
}

type CreateOrderProps = {
  id?: string;
  tenantId: string;
  branchId: string;
  orderNumber: number;
  type: OrderType;
  paymentMethod: PaymentMethod | null;  // null when payment is deferred
  payments: OrderPayment[];
  items: OrderItem[];
  notes?: string | null;
  createdBy: string;
  customerId?: string | null;
};

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]:   [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.DELIVERED,  OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
};

export class Order {
  readonly id: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  readonly payments: OrderPayment[];
  readonly isPaid: boolean;
  readonly items: OrderItem[];
  readonly subtotal: number;
  readonly total: number;
  notes: string | null;
  readonly createdBy: string;
  customerId: string | null;
  readonly customer: OrderCustomer | null;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: OrderProps) {
    this.id            = props.id;
    this.tenantId      = props.tenantId;
    this.branchId      = props.branchId;
    this.orderNumber   = props.orderNumber;
    this.type          = props.type;
    this.status        = props.status;
    this.paymentMethod = props.paymentMethod;
    this.payments      = props.payments;
    this.isPaid        = props.payments.length > 0;
    this.items         = props.items;
    this.subtotal      = props.subtotal;
    this.total         = props.total;
    this.notes         = props.notes;
    this.createdBy     = props.createdBy;
    this.customerId    = props.customerId ?? null;
    this.customer      = props.customer ?? null;
    this.createdAt     = props.createdAt;
    this.updatedAt     = props.updatedAt;
  }

  static create(props: CreateOrderProps): Order {
    const id  = props.id ?? uuidv4();
    const now = new Date();

    const subtotal = Math.round(props.items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
    const total    = subtotal;

    return new Order({
      id,
      tenantId:      props.tenantId,
      branchId:      props.branchId,
      orderNumber:   props.orderNumber,
      type:          props.type,
      status:        OrderStatus.PENDING,
      paymentMethod: props.paymentMethod,
      payments:      props.payments,
      items:         props.items,
      subtotal,
      total,
      notes:         props.notes ?? null,
      createdBy:     props.createdBy,
      customerId:    props.customerId ?? null,
      createdAt:     now,
      updatedAt:     now,
    });
  }

  static reconstitute(props: OrderProps): Order {
    return new Order(props);
  }

  edit(fields: { notes?: string | null; type?: OrderType; customerId?: string | null; paymentMethod?: PaymentMethod }): void {
    if (fields.notes         !== undefined) this.notes         = fields.notes;
    if (fields.type          !== undefined) this.type          = fields.type;
    if (fields.customerId    !== undefined) this.customerId    = fields.customerId;
    if (fields.paymentMethod !== undefined) this.paymentMethod = fields.paymentMethod;
    this.updatedAt = new Date();
  }

  updateStatus(newStatus: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[this.status];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: cannot move from '${this.status}' to '${newStatus}'. ` +
          `Allowed transitions: [${allowed?.join(', ') ?? 'none'}]`,
      );
    }

    this.status    = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * Merges additional items into the order.
   * - If a productId already exists, its quantity is incremented and subtotal recalculated.
   * - New products are appended.
   * - Order subtotal and total are recalculated.
   * Returns the final merged list of items.
   */
  addItems(newItems: OrderItem[]): OrderItem[] {
    const merged = [...this.items];

    for (const incoming of newItems) {
      const existing = merged.find((i) => i.productId === incoming.productId);
      if (existing) {
        const newQty      = existing.quantity + incoming.quantity;
        const newSubtotal = Math.round(newQty * existing.unitPrice * 100) / 100;
        // Reconstitute with updated quantity/subtotal
        const updated = OrderItem.reconstitute({
          id:          existing.id,
          orderId:     existing.orderId,
          productId:   existing.productId,
          productName: existing.productName,
          quantity:    newQty,
          unitPrice:   existing.unitPrice,
          subtotal:    newSubtotal,
        });
        merged.splice(merged.indexOf(existing), 1, updated);
      } else {
        merged.push(incoming);
      }
    }

    const newSubtotal = Math.round(merged.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
    // Mutate — these fields are mutable via Object.defineProperty trick-free approach:
    (this as { items: OrderItem[] }).items       = merged;
    (this as { subtotal: number }).subtotal      = newSubtotal;
    (this as { total: number }).total            = newSubtotal;
    this.updatedAt = new Date();

    return merged;
  }
}
