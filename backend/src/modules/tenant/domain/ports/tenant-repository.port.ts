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
  productCount: number;
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
  /** Tenants suscritos a un plan. Se usa para resincronizarlos si el plan cambia. */
  findByPlan(plan: SaasPlan): Promise<Tenant[]>;
  toggleActive(id: string): Promise<Tenant>;
  /**
   * Persiste el estado efectivo de los módulos junto con las excepciones del
   * admin que lo produjeron. Van juntos a propósito: guardar uno sin el otro
   * deja el tenant en un estado que el próximo cambio de plan no sabría
   * recalcular. `overrides` en null borra todas las excepciones.
   *
   * `plan` viaja en la misma escritura cuando el cambio lo incluye: si fueran
   * dos UPDATE y el segundo fallara, el tenant quedaba con el plan nuevo y los
   * módulos del viejo.
   */
  applyModules(
    id: string,
    modules: TenantModules,
    overrides: Partial<TenantModules> | null,
    plan?: SaasPlan,
  ): Promise<Tenant>;
  updateSettings(id: string, settings: Partial<TenantSettings>): Promise<Tenant>;
}
