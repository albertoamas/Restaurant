import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { OrderStatus } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, newStatus: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(id, tenantId);

    if (!order) {
      throw new NotFoundException(`Order with id '${id}' not found`);
    }

    try {
      order.updateStatus(newStatus);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const saved = await this.orderRepository.save(order);
    this.eventsService?.emit(tenantId, saved.branchId, 'order.updated', saved);
    return saved;
  }
}
