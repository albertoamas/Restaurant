import { v4 as uuidv4 } from 'uuid';

export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;

  private constructor(props: OrderItemProps) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.productId = props.productId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.subtotal = props.subtotal;
  }

  static create(props: {
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }): OrderItem {
    const subtotal = props.quantity * props.unitPrice;

    return new OrderItem({
      id: uuidv4(),
      orderId: props.orderId,
      productId: props.productId,
      productName: props.productName,
      quantity: props.quantity,
      unitPrice: props.unitPrice,
      subtotal,
    });
  }

  static reconstitute(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }
}
