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
    const existing = await this.repo.findOpenByBranch(tenantId, branchId);
    if (existing) {
      throw new ConflictException('Ya existe una caja abierta para esta sucursal');
    }

    const session = CashSession.open({
      tenantId, branchId, openedBy: userId,
      openingAmount: dto.openingAmount, notes: dto.notes,
    });

    const saved = await this.repo.save(session);
    this.eventsService?.emitToTenant(tenantId, 'cash.opened', saved);
    return saved;
  }
}
