import { Inject, Injectable } from '@nestjs/common';
import { BranchDailySeriesItemDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

/**
 * Evolución diaria de las ventas de cada sucursal. Igual que `GetByBranchUseCase`
 * no acepta `branchId`: sirve para comparar locales entre sí, así que siempre
 * trae todos.
 */
@Injectable()
export class GetDailySeriesByBranchUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(tenantId: string, from?: string, to?: string): Promise<BranchDailySeriesItemDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.orderRepo.getDailySeriesByBranch(tenantId, from || defaultStart, to || defaultEnd);
  }
}
