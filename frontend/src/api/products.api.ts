import client from './client';
import type { ProductDto, CreateProductRequest, UpdateProductRequest } from '@pos/shared';

export const productsApi = {
  getAll: (categoryId?: string, includeInactive = false) =>
    client
      .get<ProductDto[]>('/api/v1/products', {
        params: {
          ...(categoryId ? { categoryId } : {}),
          ...(includeInactive ? { includeInactive: 'true' } : {}),
        },
      })
      .then((r) => r.data),

  getOne: (id: string) =>
    client.get<ProductDto>(`/api/v1/products/${id}`).then((r) => r.data),

  create: (data: CreateProductRequest) =>
    client.post<ProductDto>('/api/v1/products', data).then((r) => r.data),

  update: (id: string, data: UpdateProductRequest) =>
    client.patch<ProductDto>(`/api/v1/products/${id}`, data).then((r) => r.data),

  toggle: (id: string) =>
    client.patch<ProductDto>(`/api/v1/products/${id}/toggle`).then((r) => r.data),
};
