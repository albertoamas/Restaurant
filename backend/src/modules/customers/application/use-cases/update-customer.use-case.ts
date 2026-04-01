import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../domain/ports/customer-repository.port';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly repo: CustomerRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.repo.findById(id, tenantId);
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (dto.phone && dto.phone !== customer.phone) {
      const existing = await this.repo.findByPhone(dto.phone, tenantId);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Ya existe un cliente con el teléfono ${dto.phone}`);
      }
    }

    customer.update(dto);
    return this.repo.save(customer);
  }
}
