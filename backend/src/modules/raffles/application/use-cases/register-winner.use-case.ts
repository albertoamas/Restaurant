import { BadRequestException, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { RaffleDetailDto, SOCKET_EVENTS } from '@pos/shared';
import { nextPositionToDraw } from '../../domain/entities/raffle.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { EventsService } from '../../../events/events.service';

/**
 * El sorteo se hace en una ánfora física: el dueño saca un ticket y registra aquí su número.
 * Los puestos se registran del último al primero.
 */
@Injectable()
export class RegisterWinnerUseCase {
  private readonly logger = new Logger(RegisterWinnerUseCase.name);

  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(raffleId: string, tenantId: string, ticketNumber: number): Promise<RaffleDetailDto> {
    const raffle = await this.repo.findRaffleById(raffleId, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${raffleId} no encontrado`);
    if (raffle.isActive) {
      throw new BadRequestException('Cierra el sorteo antes de registrar ganadores: así no entran tickets nuevos mientras se elige');
    }
    if (!raffle.isDrawable) {
      throw new BadRequestException('El sorteo ya fue completado, no se pueden registrar más ganadores');
    }

    const ticket = await this.repo.findTicketByNumber(raffleId, tenantId, ticketNumber);
    if (!ticket) throw new NotFoundException(`El ticket #${ticketNumber} no existe en este sorteo`);

    const winners = await this.repo.findWinnersByRaffleId(raffleId, tenantId);
    const activeWinners = winners.filter((w) => !w.voided);

    const position = nextPositionToDraw(raffle.numberOfWinners, activeWinners.map((w) => w.position));
    if (position === null) {
      throw new BadRequestException('El sorteo ya fue completado: todas las posiciones tienen ganador');
    }

    const previous = activeWinners.find((w) => w.customerId === ticket.customerId);
    if (previous) {
      throw new BadRequestException(
        `Ese cliente ya ganó el puesto ${previous.position}: cada cliente gana un solo premio. Saca otro ticket del ánfora`,
      );
    }

    const winner = RaffleWinner.create({
      tenantId,
      raffleId,
      customerId: ticket.customerId,
      ticketId: ticket.id,
      position,
      prizeDescription: raffle.prizes.find((p) => p.position === position)?.prizeDescription ?? null,
    });

    // Con este ganador quedan todos los puestos cubiertos (DRAWN) o falta alguno (DRAWING)
    if (activeWinners.length + 1 >= raffle.numberOfWinners) {
      raffle.finishDrawing();
    } else {
      raffle.startDrawing();
    }

    // Inserción atómica: bloqueo del sorteo + re-check de estado + insert winner + update status
    await this.repo.addWinnerAtomic(raffleId, tenantId, winner, raffle.status);
    this.logger.log(`winner registered raffleId=${raffleId} tenantId=${tenantId} position=${position} ticket=#${ticketNumber} newStatus=${raffle.status}`);

    const result = await this.repo.findRaffleWithTickets(raffleId, tenantId);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_UPDATED, result);
    return result!;
  }
}
