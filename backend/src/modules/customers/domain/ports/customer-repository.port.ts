import { Customer } from '../entities/customer.entity';
import { CustomerSearchResult, CustomerStatsDto } from '@pos/shared';

export const CUSTOMER_REPOSITORY_PORT = 'CustomerRepositoryPort';

export interface CustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  findById(id: string, tenantId: string): Promise<Customer | null>;
  findByPhone(phone: string, tenantId: string): Promise<Customer | null>;
  findAll(tenantId: string, q?: string, page?: number, limit?: number, sortBy?: 'name' | 'totalSpent' | 'purchaseCount', sortDir?: 'asc' | 'desc'): Promise<{ data: CustomerStatsDto[]; total: number }>;
  findOneWithStats(id: string, tenantId: string): Promise<CustomerStatsDto | null>;
  search(q: string, tenantId: string): Promise<CustomerSearchResult[]>;
}
