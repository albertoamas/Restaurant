import { Inject, Injectable } from '@nestjs/common';
import { BranchReportDto } from '@pos/shared';
import { OrderRepositoryPort } from '../../../orders/domain/ports/order-repository.port';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

/**
 * Comparativa entre sucursales. A diferencia del resto de reportes no acepta
 * `branchId`: su razón de ser es justamente ver todas juntas.
 */
@Injectable()
export class GetByBranchUseCase {
  constructor(
    @Inject('OrderRepositoryPort')
    private readonly orderRepo: OrderRepositoryPort,
  ) {}

  execute(tenantId: string, from?: string, to?: string): Promise<BranchReportDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    return this.orderRepo.getByBranch(tenantId, from || defaultStart, to || defaultEnd);
  }
}
