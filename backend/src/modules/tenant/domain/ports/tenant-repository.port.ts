import { Tenant } from '../entities/tenant.entity';

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<Tenant>;
}
