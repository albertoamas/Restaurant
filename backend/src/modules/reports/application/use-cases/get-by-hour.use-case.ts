import { Inject, Injectable } from '@nestjs/common';
import { HourlyDataDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetByHourUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(
    tenantId: string,
    branchId: string | null,
    from?: string,
    to?: string,
  ): Promise<HourlyDataDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.orderRepo.getByHour(
      tenantId,
      branchId,
      from || defaultStart,
      to   || defaultEnd,
    );
  }
}
