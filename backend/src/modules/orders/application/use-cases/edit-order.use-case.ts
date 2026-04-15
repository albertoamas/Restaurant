import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { EventsService } from '../../../events/events.service';
import { EditOrderDto } from '../dto/edit-order.dto';
import { Customer } from '../../../customers/domain/entities/customer.entity';
import { CustomerRepositoryPort, CUSTOMER_REPOSITORY_PORT } from '../../../customers/domain/ports/customer-repository.port';

@Injectable()
export class EditOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,

    @Optional() @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository?: CustomerRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, dto: EditOrderDto): Promise<Order> {
    const order = await this.orderRepository.findById(id, tenantId);

    if (!order) {
      throw new NotFoundException(`Order with id '${id}' not found`);
    }

    // Resolve customer if provided
    let resolvedCustomerId: string | null | undefined;

    if (this.customerRepository) {
      if (dto.customerId !== undefined) {
        // Explicit null clears the customer; a UUID links an existing one
        if (dto.customerId === null) {
          resolvedCustomerId = null;
        } else {
          resolvedCustomerId = dto.customerId;
        }
      } else if (dto.createCustomer) {
        const phone = dto.createCustomer.phone?.trim() || null;
        let customer: Customer | null = null;

        if (phone) {
          customer = await this.customerRepository.findByPhone(phone, tenantId);
        }

        if (!customer) {
          const newCustomer = Customer.create({
            tenantId,
            name: dto.createCustomer.name,
            phone: phone ?? undefined,
            email: dto.createCustomer.email,
          });
          customer = await this.customerRepository.save(newCustomer);
        }

        resolvedCustomerId = customer.id;
      }
    }

    order.edit({
      type:          dto.type,
      notes:         dto.notes,
      customerId:    resolvedCustomerId,
      paymentMethod: dto.paymentMethod,
    });

    const saved = await this.orderRepository.update(order);
    this.eventsService?.emitToTenant(tenantId, 'order.updated', saved);
    return saved;
  }
}
