import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';

@Injectable()
export class ToggleRaffleWinnerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.repo.findById(id, tenantId);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    customer.toggleRaffleWinner();
    return this.repo.save(customer);
  }
}
