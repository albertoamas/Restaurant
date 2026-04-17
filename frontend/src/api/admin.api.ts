import client from './client';
import type { SaasPlan, PlanLimits } from '@pos/shared';

export interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
}

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  plan: SaasPlan;
  owner: { name: string; email: string } | null;
  modules: TenantModules;
  branchCount: number;
  cashierCount: number;
}

export interface PlanRow {
  id: SaasPlan;
  displayName: string;
  priceBs: number;
  maxBranches: number;
  maxCashiers: number;
  maxProducts: number;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
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

  ping: (key: string) =>
    client.get<{ ok: boolean }>('/api/v1/admin/ping', { headers: { 'x-admin-key': key } }).then((r) => r.data),

  // ── Tenants ────────────────────────────────────────────────
  getTenants: () =>
    client.get<TenantRow[]>('/api/v1/admin/tenants', { headers: adminHeaders() }).then((r) => r.data),

  createTenant: (payload: CreateTenantPayload) =>
    client.post<{ tenantId: string; message: string }>('/api/v1/admin/tenants', payload, { headers: adminHeaders() }).then((r) => r.data),

  toggleTenant: (id: string) =>
    client.patch<{ id: string; isActive: boolean }>(`/api/v1/admin/tenants/${id}/toggle`, {}, { headers: adminHeaders() }).then((r) => r.data),

  updateTenantPlan: (id: string, plan: SaasPlan) =>
    client.patch(`/api/v1/admin/tenants/${id}/plan`, { plan }, { headers: adminHeaders() }).then((r) => r.data),

  updateModules: (id: string, modules: Partial<TenantModules>) =>
    client.patch<TenantModules>(`/api/v1/admin/tenants/${id}/modules`, modules, { headers: adminHeaders() }).then((r) => r.data),

  // ── Plans ──────────────────────────────────────────────────
  getPlans: () =>
    client.get<PlanRow[]>('/api/v1/admin/plans', { headers: adminHeaders() }).then((r) => r.data),

  updatePlan: (id: SaasPlan, updates: Partial<Omit<PlanRow, 'id'> & PlanLimits>) =>
    client.patch<PlanRow>(`/api/v1/admin/plans/${id}`, updates, { headers: adminHeaders() }).then((r) => r.data),
};
