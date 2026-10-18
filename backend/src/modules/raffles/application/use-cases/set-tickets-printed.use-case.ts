import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class SetTicketsPrintedUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(raffleId: string, ticketIds: string[], printed: boolean, tenantId: string): Promise<void> {
    const raffle = await this.repo.findRaffleById(raffleId, tenantId);
    if (!raffle) throw new NotFoundException('Sorteo no encontrado');

    await this.repo.setTicketsPrinted(raffleId, ticketIds, tenantId, printed);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_PRINT_CHANGED, { raffleId });
  }
}
