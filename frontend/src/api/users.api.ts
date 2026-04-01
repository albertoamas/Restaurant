import api from './client';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'CASHIER';
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCashierRequest {
  name: string;
  email: string;
  password: string;
  branchId?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getAll: () => api.get<UserDto[]>('/api/v1/auth/users').then((r) => r.data),
  create: (data: CreateCashierRequest) =>
    api.post<UserDto>('/api/v1/auth/users', data).then((r) => r.data),
  toggle: (id: string) =>
    api.patch<UserDto>(`/api/v1/auth/users/${id}/toggle`).then((r) => r.data),
  changePassword: (data: ChangePasswordRequest) =>
    api.patch('/api/v1/auth/me/password', data),
  updateBranch: (userId: string, branchId: string | null) =>
    api.patch(`/api/v1/auth/users/${userId}/branch`, { branchId }),
};
