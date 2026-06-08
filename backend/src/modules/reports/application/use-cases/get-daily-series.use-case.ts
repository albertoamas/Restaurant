import { Inject, Injectable } from '@nestjs/common';
import { DailySeriesItemDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetDailySeriesUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(
    tenantId: string,
    branchId: string | null,
    from?: string,
    to?: string,
  ): Promise<DailySeriesItemDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.orderRepo.getDailySeries(
      tenantId,
      branchId,
      from || defaultStart,
      to   || defaultEnd,
    );
  }
}
