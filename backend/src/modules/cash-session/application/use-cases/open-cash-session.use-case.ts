import { ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { OpenCashSessionDto } from '../dto/open-cash-session.dto';

@Injectable()
export class OpenCashSessionUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: OpenCashSessionDto): Promise<CashSession> {
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
      this.eventsService?.emitToTenant(tenantId, 'cash.opened', saved);
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
