import { Inject, Injectable } from '@nestjs/common';
import { CustomerStatsDto } from '@pos/shared';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
  ) {}

  async execute(tenantId: string, q?: string, page?: number, limit?: number): Promise<CustomerStatsDto[]> {
    return this.repo.findAll(tenantId, q, page, limit);
  }
}
