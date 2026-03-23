import client from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@pos/shared';

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<AuthResponse>('/api/v1/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    client.post<AuthResponse>('/api/v1/auth/register', data).then((r) => r.data),

  getMe: () =>
    client.get<AuthResponse['user']>('/api/v1/auth/me').then((r) => r.data),
};
