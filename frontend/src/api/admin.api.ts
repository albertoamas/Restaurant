import client from './client';

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  owner: { name: string; email: string } | null;
}

export interface CreateTenantPayload {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
}

const KEY = 'pos_admin_key';

function adminHeaders() {
  return { 'x-admin-key': sessionStorage.getItem(KEY) ?? '' };
}

export const adminApi = {
  saveKey: (key: string) => sessionStorage.setItem(KEY, key),
  clearKey: () => sessionStorage.removeItem(KEY),
  hasKey: () => !!sessionStorage.getItem(KEY),

  getTenants: () =>
    client.get<TenantRow[]>('/api/v1/admin/tenants', { headers: adminHeaders() }).then((r) => r.data),

  createTenant: (payload: CreateTenantPayload) =>
    client.post<{ tenantId: string; message: string }>('/api/v1/admin/tenants', payload, { headers: adminHeaders() }).then((r) => r.data),

  toggleTenant: (id: string) =>
    client.patch<{ id: string; isActive: boolean }>(`/api/v1/admin/tenants/${id}/toggle`, {}, { headers: adminHeaders() }).then((r) => r.data),
};
