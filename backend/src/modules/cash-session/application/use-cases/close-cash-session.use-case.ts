import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { MetricsService } from '../../../../common/metrics/metrics.service';
import { CloseCashSessionDto } from '../dto/close-cash-session.dto';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';

@Injectable()
export class CloseCashSessionUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
    private readonly branchAccess: BranchAccessService,
    @Optional() private readonly eventsService?: EventsService,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CloseCashSessionDto): Promise<CashSession> {
    // `assertBelongsToTenant` y no `assertUsable`: una sucursal en proceso de
    // baja igual tiene que poder cerrar su caja — es justamente el paso previo
    // a desactivarla.
    await this.branchAccess.assertBelongsToTenant(branchId, tenantId);

    const session = await this.repo.findOpenByBranch(tenantId, branchId);
    if (!session) {
      throw new NotFoundException('No hay caja abierta para esta sucursal');
    }

    const cashSales = await this.repo.getCashSalesDuringSession(tenantId, branchId, session.openedAt);
    session.close(userId, dto.closingAmount, cashSales, dto.notes);

    const saved = await this.repo.save(session);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.CASH_CLOSED, saved);
    this.metricsService?.recordCashSessionClosed();
    return saved;
  }
}
