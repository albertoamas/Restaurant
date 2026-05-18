import { Inject, Injectable } from '@nestjs/common';
import { OrderRepositoryPort, DailyReportResult } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetReportByRangeUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(tenantId: string, branchId: string | null, from?: string, to?: string): Promise<DailyReportResult> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.orderRepo.getReportByRange(
      tenantId,
      branchId,
      from || defaultStart,
      to   || defaultEnd,
    );
  }
}
