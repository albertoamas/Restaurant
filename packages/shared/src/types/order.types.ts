import { OrderType, OrderStatus, PaymentMethod } from './enums';
import { CreateCustomerRequest } from './customer.types';

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  branchId?: string;
  type: OrderType;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: CreateOrderItemRequest[];
  customerId?: string;
  createCustomer?: CreateCustomerRequest;
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
  branchId: string;
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
  customerId?: string | null;
  customer?: { id: string; name: string; phone: string | null } | null;
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

export interface TopProductDto {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string | null;
  totalQuantity: number;
  totalRevenue: number;
}
