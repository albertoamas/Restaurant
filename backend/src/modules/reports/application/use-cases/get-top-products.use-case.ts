import { Inject, Injectable } from '@nestjs/common';
import { TopProductDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetTopProductsUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(
    tenantId: string,
    branchId: string | null,
    from?: string,
    to?: string,
    categoryId?: string,
    limit?: number,
  ): Promise<TopProductDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const effectiveLimit = Math.min(limit ?? 20, 100);
    return this.orderRepo.getTopProducts(
      tenantId,
      branchId,
      from || defaultStart,
      to   || defaultEnd,
      categoryId,
      effectiveLimit,
    );
  }
}
