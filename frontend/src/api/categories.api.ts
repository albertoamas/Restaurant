import client from './client';
import type { CategoryDto, CreateCategoryRequest, UpdateCategoryRequest } from '@pos/shared';

export const categoriesApi = {
  getAll: () =>
    client.get<CategoryDto[]>('/api/v1/categories').then((r) => r.data),

  create: (data: CreateCategoryRequest) =>
    client.post<CategoryDto>('/api/v1/categories', data).then((r) => r.data),

  update: (id: string, data: UpdateCategoryRequest) =>
    client.patch<CategoryDto>(`/api/v1/categories/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/v1/categories/${id}`).then((r) => r.data),
};
