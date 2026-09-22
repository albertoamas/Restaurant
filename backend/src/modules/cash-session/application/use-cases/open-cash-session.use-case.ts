import { ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';
import { MetricsService } from '../../../../common/metrics/metrics.service';
import { OpenCashSessionDto } from '../dto/open-cash-session.dto';

@Injectable()
export class OpenCashSessionUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
    private readonly branchAccess: BranchAccessService,
    @Optional() private readonly eventsService?: EventsService,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: OpenCashSessionDto): Promise<CashSession> {
    // El OWNER manda branchId por query: validar antes de crear nada.
    await this.branchAccess.assertUsable(branchId, tenantId);

    // Rechazo rápido en la capa de aplicación (mayoría de casos, sin tocar el índice).
    const existing = await this.repo.findOpenByBranch(tenantId, branchId);
    if (existing) {
      throw new ConflictException('Ya existe una caja abierta para esta sucursal');
    }

    const session = CashSession.open({
      tenantId, branchId, openedBy: userId,
      openingAmount: dto.openingAmount, notes: dto.notes,
    });

    try {
      const saved = await this.repo.save(session);
      this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.CASH_OPENED, saved);
      this.metricsService?.recordCashSessionOpened();
      return saved;
    } catch (err: unknown) {
      // El índice único parcial uq_one_open_session_per_branch rechaza el segundo
      // INSERT cuando dos requests pasan el check anterior de forma simultánea.
      // P2002 = unique constraint violation en Prisma.
      if (err !== null && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
        throw new ConflictException('Ya existe una caja abierta para esta sucursal');
      }
      throw err;
    }
  }
}
