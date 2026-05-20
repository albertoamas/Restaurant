import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { RaffleDetailDto, SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { UpdateRaffleDto } from '../dto/update-raffle.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateRaffleDto): Promise<RaffleDetailDto> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException('Sorteo no encontrado');

    if (dto.prizes?.length) {
      const existingPositions = new Set(raffle.prizes.map((p) => p.position));
      for (const p of dto.prizes) {
        if (!existingPositions.has(p.position)) {
          throw new BadRequestException(`La posición ${p.position} no existe en este sorteo`);
        }
      }
    }

    await this.repo.updateRaffle(id, tenantId, {
      name:        dto.name?.trim(),
      description: dto.description !== undefined ? (dto.description.trim() || null) : undefined,
      prizes:      dto.prizes,
    });

    const updated = await this.repo.findRaffleWithTickets(id, tenantId);
    if (!updated) throw new NotFoundException('Sorteo no encontrado');
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.RAFFLE_UPDATED, updated);
    return updated;
  }
}
