import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';

export interface ListOrdersFilters {
  date?: string;
  from?: string;
  to?: string;
  status?: OrderStatus;
  branchId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(tenantId: string, filters: ListOrdersFilters = {}): Promise<Order[]> {
    return this.orderRepository.findAll(tenantId, filters);
  }
}
