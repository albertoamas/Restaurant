import { SaasPlan } from '@pos/shared';
import { Tenant, TenantModules, TenantSettings } from '../entities/tenant.entity';

export interface TenantWithOwner {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  plan: SaasPlan;
  owner: { id: string; name: string; email: string } | null;
  modules: TenantModules;
  settings: TenantSettings;
  branchCount: number;
  cashierCount: number;
}

export interface NewOwnerProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<Tenant>;
  /**
   * Alta completa en una sola transacción: tenant + dueño + sucursal inicial.
   * Si cualquiera de las tres escrituras falla, no queda nada a medio crear
   * (sin esto, un tenant sin dueño quedaba huérfano e inutilizable).
   */
  createTenantWithOwner(tenant: Tenant, owner: NewOwnerProps, branchName: string): Promise<Tenant>;
  findAll(): Promise<TenantWithOwner[]>;
  toggleActive(id: string): Promise<Tenant>;
  updatePlan(id: string, plan: SaasPlan): Promise<Tenant>;
  updateModules(id: string, modules: Partial<TenantModules>): Promise<Tenant>;
  updateSettings(id: string, settings: Partial<TenantSettings>): Promise<Tenant>;
}
