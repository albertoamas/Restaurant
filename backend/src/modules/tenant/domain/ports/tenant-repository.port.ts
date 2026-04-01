import { Tenant } from '../entities/tenant.entity';

export interface TenantWithOwner {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  owner: { name: string; email: string } | null;
}

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<Tenant>;
  findAll(): Promise<TenantWithOwner[]>;
  toggleActive(id: string): Promise<Tenant>;
}
