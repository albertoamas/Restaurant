import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
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

    return this.orderRepository.save(order);
  }
}
