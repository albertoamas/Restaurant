import client from './client';
import type { OrderDto, CreateOrderRequest, OrderStatus, CreateOrderPaymentRequest } from '@pos/shared';

interface OrdersParams {
  date?: string;
  status?: OrderStatus;
  branchId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export const ordersApi = {
  create: (data: CreateOrderRequest) =>
    client.post<OrderDto>('/api/v1/orders', data).then((r) => r.data),

  getAll: (params?: OrdersParams) =>
    client.get<OrderDto[]>('/api/v1/orders', { params }).then((r) => r.data),

  getOne: (id: string) =>
    client.get<OrderDto>(`/api/v1/orders/${id}`).then((r) => r.data),

  updateStatus: (id: string, status: OrderStatus) =>
    client.patch<OrderDto>(`/api/v1/orders/${id}/status`, { status }).then((r) => r.data),

  registerPayments: (id: string, payments: CreateOrderPaymentRequest[]) =>
    client.post<OrderDto>(`/api/v1/orders/${id}/payments`, { payments }).then((r) => r.data),
};
