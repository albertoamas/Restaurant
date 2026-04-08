import { PaymentMethod } from '@pos/shared';

export interface OrderPaymentProps {
  id: string;
  orderId: string;
  tenantId: string;
  method: PaymentMethod;
  amount: number;
}

export class OrderPayment {
  readonly id: string;
  readonly orderId: string;
  readonly tenantId: string;
  readonly method: PaymentMethod;
  readonly amount: number;

  constructor(props: OrderPaymentProps) {
    this.id       = props.id;
    this.orderId  = props.orderId;
    this.tenantId = props.tenantId;
    this.method   = props.method;
    this.amount   = props.amount;
  }
}
