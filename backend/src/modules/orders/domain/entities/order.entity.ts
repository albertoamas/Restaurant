import { v4 as uuidv4 } from 'uuid';
import { OrderType, OrderStatus, PaymentMethod } from '@pos/shared';
import { OrderItem } from './order-item.entity';
import { OrderPayment } from './order-payment.entity';

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
  readonly type: OrderType;
  status: OrderStatus;
  readonly paymentMethod: PaymentMethod | null;
  readonly payments: OrderPayment[];
  readonly isPaid: boolean;
  readonly items: OrderItem[];
  readonly subtotal: number;
  readonly total: number;
  readonly notes: string | null;
  readonly createdBy: string;
  readonly customerId: string | null;
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
}
