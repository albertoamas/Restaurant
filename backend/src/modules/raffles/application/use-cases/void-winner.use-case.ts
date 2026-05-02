import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDetailDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class VoidWinnerUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(raffleId: string, winnerId: string, tenantId: string): Promise<RaffleDetailDto> {
    const raffle = await this.repo.findRaffleById(raffleId, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${raffleId} no encontrado`);

    if (raffle.status !== 'DRAWING' && raffle.status !== 'DRAWN') {
      throw new BadRequestException('Solo se pueden anular ganadores de sorteos en curso o finalizados');
    }

    const winners = await this.repo.findWinnersByRaffleId(raffleId, tenantId);
    const winner = winners.find((w) => w.id === winnerId && !w.voided);
    if (!winner) throw new NotFoundException(`Ganador ${winnerId} no encontrado o ya anulado`);

    await this.repo.voidWinner(winnerId, raffleId, tenantId);

    // Si el sorteo estaba DRAWN, vuelve a DRAWING para sortear esa posición.
    if (raffle.status === 'DRAWN') {
      raffle.backToDrawing();
      await this.repo.saveRaffle(raffle);
    }

    const result = await this.repo.findRaffleWithTickets(raffleId, tenantId);
    return result!;
  }
}
