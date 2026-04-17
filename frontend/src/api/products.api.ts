import client from './client';
import type { ProductDto, CreateProductRequest, UpdateProductRequest } from '@pos/shared';

export const productsApi = {
  getAll: (params?: { categoryId?: string; includeInactive?: boolean; page?: number; limit?: number; q?: string }) =>
    client
      .get('/api/v1/products', {
        params: {
          ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
          ...(params?.includeInactive ? { includeInactive: 'true' } : {}),
          ...(params?.page ? { page: params.page } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
          ...(params?.q ? { q: params.q } : {}),
        },
      })
      .then((r) => ({
        data: r.data as ProductDto[],
        total: Number(r.headers['x-total-count'] ?? r.data.length),
      })),

  getOne: (id: string) =>
    client.get<ProductDto>(`/api/v1/products/${id}`).then((r) => r.data),

  create: (data: CreateProductRequest) =>
    client.post<ProductDto>('/api/v1/products', data).then((r) => r.data),

  update: (id: string, data: UpdateProductRequest) =>
    client.patch<ProductDto>(`/api/v1/products/${id}`, data).then((r) => r.data),

  toggle: (id: string) =>
    client.patch<ProductDto>(`/api/v1/products/${id}/toggle`).then((r) => r.data),
};
