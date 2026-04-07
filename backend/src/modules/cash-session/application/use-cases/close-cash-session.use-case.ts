import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { CloseCashSessionDto } from '../dto/close-cash-session.dto';

@Injectable()
export class CloseCashSessionUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CloseCashSessionDto): Promise<CashSession> {
    const session = await this.repo.findOpenByBranch(tenantId, branchId);
    if (!session) {
      throw new NotFoundException('No hay caja abierta para esta sucursal');
    }

    const cashSales = await this.repo.getCashSalesDuringSession(tenantId, branchId, session.openedAt);
    session.close(userId, dto.closingAmount, cashSales, dto.notes);

    const saved = await this.repo.save(session);
    this.eventsService?.emitToTenant(tenantId, 'cash.closed', saved);
    return saved;
  }
}
