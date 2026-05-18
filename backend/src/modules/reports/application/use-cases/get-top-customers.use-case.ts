import { Inject, Injectable } from '@nestjs/common';
import { TopCustomerDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetTopCustomersUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(
    tenantId: string,
    branchId: string | null,
    from?: string,
    to?: string,
    limit?: number,
  ): Promise<TopCustomerDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveLimit = Math.min(limit ?? 20, 100);
    return this.orderRepo.getTopCustomers(
      tenantId,
      branchId,
      from || defaultStart,
      to   || defaultEnd,
      effectiveLimit,
    );
  }
}
