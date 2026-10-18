import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { RaffleDetailDto, SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class VoidWinnerUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(
    raffleId: string,
    winnerId: string,
    tenantId: string,
    userId: string,
    reason: string,
  ): Promise<RaffleDetailDto> {
    const raffle = await this.repo.findRaffleById(raffleId, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${raffleId} no encontrado`);

    if (!raffle.isWinnerVoidable) {
      throw new BadRequestException('Solo se pueden anular ganadores de sorteos en curso o finalizados');
    }

    const winners = await this.repo.findWinnersByRaffleId(raffleId, tenantId);
    const winner = winners.find((w) => w.id === winnerId && !w.voided);
    if (!winner) throw new NotFoundException(`Ganador ${winnerId} no encontrado o ya anulado`);

    winner.void(userId, reason);
    // Si el sorteo estaba DRAWN, vuelve a DRAWING para sortear esa posición.
    if (raffle.status === 'DRAWN') raffle.backToDrawing();

    // Anulación y cambio de estado en una sola transacción, bajo el mismo bloqueo que el sorteo
    await this.repo.voidWinnerAtomic(winner, raffle.status);

    const result = await this.repo.findRaffleWithTickets(raffleId, tenantId);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_UPDATED, result);
    return result!;
  }
}
