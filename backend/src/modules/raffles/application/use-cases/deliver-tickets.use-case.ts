import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class DeliverTicketsUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(raffleId: string, ticketIds: string[], tenantId: string): Promise<void> {
    const raffle = await this.repo.findRaffleById(raffleId, tenantId);
    if (!raffle) throw new NotFoundException('Sorteo no encontrado');
    await this.repo.deliverTickets(raffleId, ticketIds, tenantId);
  }
}
