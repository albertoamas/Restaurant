import { Inject, Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { toBoliviaDateString } from '../../../../common/utils/timezone.util';

@Injectable()
export class ResetOrderSequenceUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(tenantId: string): Promise<{ reset: boolean }> {
    const today   = toBoliviaDateString(new Date()); // 'YYYY-MM-DD'
    const monthly = today.slice(0, 7);               // 'YYYY-MM'
    await this.orderRepository.resetOrderSequences(tenantId, [today, monthly]);
    return { reset: true };
  }
}
