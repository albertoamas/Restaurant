import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class DeleteRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${id} no encontrado`);
    if (!raffle.isDeletable) {
      throw new BadRequestException('No se puede eliminar un sorteo que ya está siendo sorteado o que fue completado');
    }

    await this.repo.deleteRaffle(id, tenantId);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.RAFFLE_DELETED, { id });
  }
}
