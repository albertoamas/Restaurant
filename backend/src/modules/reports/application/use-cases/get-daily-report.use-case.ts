import { Inject, Injectable } from '@nestjs/common';
import { OrderRepositoryPort, DailyReportResult } from '../../../orders/domain/ports/order-repository.port';
import { toBoliviaDateString } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetDailyReportUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(tenantId: string, branchId: string | null, date?: string): Promise<DailyReportResult> {
    const reportDate = date || toBoliviaDateString(new Date());
    return this.orderRepo.getDailyReport(tenantId, reportDate, branchId);
  }
}
