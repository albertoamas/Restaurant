import client from './client';
import type { OrderDto, CreateOrderRequest, OrderStatus } from '@pos/shared';

interface OrdersParams {
  date?: string;
  status?: OrderStatus;
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
};
