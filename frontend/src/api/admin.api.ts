import axios from 'axios';
import client from './client';
import type { SaasPlan, PlanDto } from '@pos/shared';

export interface TenantModules {
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
  advancedReportsEnabled: boolean;
}

export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  plan: SaasPlan;
  owner: { id: string; name: string; email: string } | null;
  modules: TenantModules;
  branchCount: number;
  cashierCount: number;
  productCount: number;
  /** MB ocupados por sus imágenes, para contrastar con `plan.maxStorageMb`. */
  storageUsedMb: number;
}

/** Un recurso que quedó por encima de lo que permite el plan nuevo (downgrade). */
export interface PlanExcess {
  resource: 'sucursales' | 'cajeros' | 'productos';
  current: number;
  max: number;
}

// Shape returned by PATCH /admin/tenants/:id/plan (Tenant domain entity serialized flat)
export interface TenantPlanUpdateResponse {
  id: string;
  plan: SaasPlan;
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  kitchenEnabled: boolean;
  rafflesEnabled: boolean;
  advancedReportsEnabled: boolean;
  /** Vacío si el cambio de plan no dejó nada fuera de límite. */
  excess: PlanExcess[];
}

/** Chequeo de alta de un negocio (`GET /admin/tenants/:id/health`). */
export interface TenantHealth {
  tenantId: string;
  isActive: boolean;
  hasBranch: boolean;
  hasActiveOwner: boolean;
  hasProducts: boolean;
  branchCount: number;
  cashierCount: number;
  productCount: number;
  /** Informativo: una diferencia es una excepción concedida a mano, no una falla. */
  moduleFlagsMatchPlan: boolean;
  withinBranchLimit: boolean;
  withinCashierLimit: boolean;
  withinProductLimit: boolean;
  ok: boolean;
}

export type { PlanDto };

export interface CreateTenantPayload {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  /** Nombre de la primera sucursal. Vacío -> se crea "Principal". */
  branchName?: string;
}

const KEY = 'pos_admin_key';

function adminHeaders() {
  return { 'x-admin-key': sessionStorage.getItem(KEY) ?? '' };
}

/** Lo emite cualquier llamada de /admin que recibe 401: la clave guardada dejó de servir. */
export const ADMIN_KEY_INVALID_EVENT = 'pos:admin-key-invalid';

/**
 * Si la clave deja de servir a mitad de sesión (se cambió ADMIN_SECRET), se borra y la página
 * vuelve al ingreso, en vez de mostrar un error en cada acción.
 */
function guard<T>(request: Promise<T>): Promise<T> {
  return request.catch((err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      sessionStorage.removeItem(KEY);
      window.dispatchEvent(new Event(ADMIN_KEY_INVALID_EVENT));
    }
    throw err;
  });
}

export const adminApi = {
  saveKey: (key: string) => sessionStorage.setItem(KEY, key),
  clearKey: () => sessionStorage.removeItem(KEY),
  hasKey: () => !!sessionStorage.getItem(KEY),

  ping: (key: string) =>
    client.get<{ ok: boolean }>('/api/v1/admin/ping', { headers: { 'x-admin-key': key } }).then((r) => r.data),

  // ── Tenants ────────────────────────────────────────────────
  getTenants: () =>
    guard(client.get<TenantRow[]>('/api/v1/admin/tenants', { headers: adminHeaders() }).then((r) => r.data)),

  createTenant: (payload: CreateTenantPayload) =>
    guard(client.post<{ tenantId: string; message: string }>('/api/v1/admin/tenants', payload, { headers: adminHeaders() }).then((r) => r.data)),

  getTenantHealth: (id: string) =>
    guard(client.get<TenantHealth>(`/api/v1/admin/tenants/${id}/health`, { headers: adminHeaders() }).then((r) => r.data)),

  toggleTenant: (id: string) =>
    guard(client.patch<{ id: string; isActive: boolean }>(`/api/v1/admin/tenants/${id}/toggle`, {}, { headers: adminHeaders() }).then((r) => r.data)),

  updateTenantPlan: (id: string, plan: SaasPlan) =>
    guard(client.patch<TenantPlanUpdateResponse>(`/api/v1/admin/tenants/${id}/plan`, { plan }, { headers: adminHeaders() }).then((r) => r.data)),

  updateModules: (id: string, modules: Partial<TenantModules>) =>
    guard(client.patch<TenantModules>(`/api/v1/admin/tenants/${id}/modules`, modules, { headers: adminHeaders() }).then((r) => r.data)),

  // ── Plans ──────────────────────────────────────────────────
  getPlans: () =>
    guard(client.get<PlanDto[]>('/api/v1/admin/plans', { headers: adminHeaders() }).then((r) => r.data)),

  updatePlan: (id: SaasPlan, updates: Partial<Omit<PlanDto, 'id'>>) =>
    guard(client.patch<PlanDto>(`/api/v1/admin/plans/${id}`, updates, { headers: adminHeaders() }).then((r) => r.data)),

  resetUserPassword: (userId: string, newPassword: string) =>
    guard(client.patch(`/api/v1/admin/users/${userId}/password`, { newPassword }, { headers: adminHeaders() })),
};
