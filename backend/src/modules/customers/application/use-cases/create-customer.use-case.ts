import { ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, dto: CreateCustomerDto): Promise<Customer> {
    if (dto.phone) {
      const existing = await this.repo.findByPhone(dto.phone, tenantId);
      if (existing) {
        throw new ConflictException(`Ya existe un cliente con el teléfono ${dto.phone}`);
      }
    }
    const customer = Customer.create({ tenantId, ...dto });
    const saved = await this.repo.save(customer);
    this.eventsService?.emitToTenant(tenantId, 'customer.created', saved);
    return saved;
  }
}
