import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { RaffleDetailDto, SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CloseRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDetailDto> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${id} no encontrado`);
    if (!raffle.isActive) throw new BadRequestException('Solo se pueden cerrar sorteos en estado ACTIVO');

    const from = raffle.status;
    raffle.close();
    await this.repo.changeStatus(id, tenantId, from, raffle.status);

    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_UPDATED, result);
    return result!;
  }
}
