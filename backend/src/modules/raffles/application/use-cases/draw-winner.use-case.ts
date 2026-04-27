import { randomInt } from 'crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDetailDto } from '@pos/shared';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class DrawWinnerUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDetailDto> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${id} no encontrado`);
    if (!raffle.isDrawable) {
      throw new BadRequestException('El sorteo ya fue completado, no se pueden sortear más ganadores');
    }

    const withTickets = await this.repo.findRaffleWithTickets(id, tenantId);
    if (!withTickets || withTickets.tickets.length === 0) {
      throw new BadRequestException('No se puede sortear — el sorteo no tiene tickets');
    }

    // withTickets.winners ya incluye todos los ganadores del sorteo.
    const activeWinners = withTickets.winners.filter((w) => !w.voided);
    const activeTicketIds = new Set(activeWinners.map((w) => w.ticketId));

    // Pool: tickets que no pertenecen a un ganador activo.
    const availableTickets = withTickets.tickets.filter((t) => !activeTicketIds.has(t.id));
    if (availableTickets.length === 0) {
      throw new BadRequestException('No quedan tickets disponibles en el ánfora');
    }

    // La próxima posición: la más alta entre las que aún no tienen ganador activo.
    const activePositions = new Set(activeWinners.map((w) => w.position));
    const allPositions = Array.from({ length: raffle.numberOfWinners }, (_, i) => i + 1);
    const missingPositions = allPositions.filter((p) => !activePositions.has(p));
    const nextPosition = Math.max(...missingPositions);

    const winnerTicket = availableTickets[randomInt(0, availableTickets.length)];

    // Buscamos el premio correspondiente a esta posición.
    const prize = raffle.prizes.find((p) => p.position === nextPosition);

    const winner = RaffleWinner.create({
      tenantId,
      raffleId: id,
      customerId: winnerTicket.customerId,
      ticketId: winnerTicket.id,
      position: nextPosition,
      prizeDescription: prize?.prizeDescription ?? null,
    });

    await this.repo.addWinner(winner);

    // Determinamos si ya se sortearon todos los lugares.
    const totalWinnersAfter = activeWinners.length + 1;
    if (totalWinnersAfter >= raffle.numberOfWinners) {
      raffle.finishDrawing();
    } else {
      raffle.startDrawing();
    }
    await this.repo.saveRaffle(raffle);

    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    return result!;
  }
}
