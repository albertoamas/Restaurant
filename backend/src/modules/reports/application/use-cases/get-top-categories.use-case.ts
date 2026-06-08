import { Inject, Injectable } from '@nestjs/common';
import { TopCategoryDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetTopCategoriesUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(
    tenantId: string,
    branchId: string | null,
    from?: string,
    to?: string,
    limit = 20,
  ): Promise<TopCategoryDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.orderRepo.getTopCategories(
      tenantId,
      branchId,
      from  || defaultStart,
      to    || defaultEnd,
      Math.min(limit, 100),
    );
  }
}
