import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerStatsDto } from '@pos/shared';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';

@Injectable()
export class GetCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<CustomerStatsDto> {
    const customer = await this.repo.findOneWithStats(id, tenantId);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }
}
