import api from './client';
import type { BranchDto, CreateBranchRequest, UpdateBranchRequest } from '@pos/shared';

export const branchesApi = {
  getAll: () => api.get<BranchDto[]>('/api/v1/branches').then((r) => r.data),
  create: (data: CreateBranchRequest) =>
    api.post<BranchDto>('/api/v1/branches', data).then((r) => r.data),
  update: (id: string, data: UpdateBranchRequest) =>
    api.patch<BranchDto>(`/api/v1/branches/${id}`, data).then((r) => r.data),
  toggle: (id: string) =>
    api.patch<BranchDto>(`/api/v1/branches/${id}/toggle`).then((r) => r.data),
};
