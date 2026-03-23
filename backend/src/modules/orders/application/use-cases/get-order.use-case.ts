import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<Order> {
    const order = await this.orderRepository.findById(id, tenantId);

    if (!order) {
      throw new NotFoundException(`Order with id '${id}' not found`);
    }

    return order;
  }
}
