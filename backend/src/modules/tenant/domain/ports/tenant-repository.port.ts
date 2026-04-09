import { SaasPlan } from '@pos/shared';
import { Tenant, TenantModules, TenantSettings } from '../entities/tenant.entity';

export interface TenantWithOwner {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  plan: SaasPlan;
  owner: { name: string; email: string } | null;
  modules: TenantModules;
  settings: TenantSettings;
  branchCount: number;
  cashierCount: number;
}

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<Tenant>;
  findAll(): Promise<TenantWithOwner[]>;
  toggleActive(id: string): Promise<Tenant>;
  updatePlan(id: string, plan: SaasPlan): Promise<Tenant>;
  updateModules(id: string, modules: Partial<TenantModules>): Promise<Tenant>;
  updateSettings(id: string, settings: Partial<TenantSettings>): Promise<Tenant>;
}
