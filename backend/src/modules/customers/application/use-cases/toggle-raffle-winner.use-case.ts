import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class ToggleRaffleWinnerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.repo.findById(id, tenantId);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    customer.toggleRaffleWinner();
    const saved = await this.repo.save(customer);
    this.eventsService?.emitToTenant(tenantId, 'customer.updated', saved);
    return saved;
  }
}
