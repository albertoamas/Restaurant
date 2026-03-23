import { OrderType, OrderStatus, PaymentMethod } from './enums';

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  type: OrderType;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: CreateOrderItemRequest[];
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDto {
  id: string;
  orderNumber: number;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  items: OrderItemDto[];
  subtotal: number;
  total: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface DailyReportDto {
  date: string;
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  paymentBreakdown: {
    cash: number;
    qr: number;
    transfer: number;
  };
  ordersByType: {
    dineIn: number;
    takeout: number;
    delivery: number;
  };
}
