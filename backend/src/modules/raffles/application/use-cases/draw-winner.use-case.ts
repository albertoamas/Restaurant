import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class DrawWinnerUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDto> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Raffle ${id} not found`);
    if (!raffle.isDrawable) throw new BadRequestException('Raffle has already been drawn');

    const withTickets = await this.repo.findRaffleWithTickets(id, tenantId);
    if (!withTickets || withTickets.tickets.length === 0) {
      throw new BadRequestException('Cannot draw a winner — raffle has no tickets');
    }

    const tickets = withTickets.tickets;
    const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];
    raffle.draw(winnerTicket.customerId, winnerTicket.id);
    await this.repo.saveRaffle(raffle);

    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    return result!;
  }
}
