import { Inject, Injectable } from '@nestjs/common';
import { CustomerSearchResult } from '@pos/shared';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';

@Injectable()
export class SearchCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
  ) {}

  async execute(q: string, tenantId: string): Promise<CustomerSearchResult[]> {
    if (!q || q.trim().length < 2) return [];
    return this.repo.search(q.trim(), tenantId);
  }
}
