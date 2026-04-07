import client from './client';
import type {
  CustomerDto,
  CustomerStatsDto,
  CustomerSearchResult,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@pos/shared';

export const customersApi = {
  search: (q: string): Promise<CustomerSearchResult[]> =>
    client.get('/api/v1/customers/search', { params: { q } }).then((r) => r.data),

  getAll: (params?: { q?: string; page?: number; limit?: number }): Promise<CustomerStatsDto[]> =>
    client.get('/api/v1/customers', { params }).then((r) => r.data),

  getOne: (id: string): Promise<CustomerStatsDto> =>
    client.get(`/api/v1/customers/${id}`).then((r) => r.data),

  create: (data: CreateCustomerRequest): Promise<CustomerDto> =>
    client.post('/api/v1/customers', data).then((r) => r.data),

  update: (id: string, data: UpdateCustomerRequest): Promise<CustomerDto> =>
    client.patch(`/api/v1/customers/${id}`, data).then((r) => r.data),

  toggleRaffle: (id: string): Promise<CustomerDto> =>
    client.patch(`/api/v1/customers/${id}/raffle`).then((r) => r.data),

  deliverTicket: (id: string): Promise<CustomerDto> =>
    client.post(`/api/v1/customers/${id}/tickets/deliver`).then((r) => r.data),
};
