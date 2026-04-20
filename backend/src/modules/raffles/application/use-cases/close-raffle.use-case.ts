import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class CloseRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDto> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${id} no encontrado`);
    if (!raffle.isActive) throw new BadRequestException('Solo se pueden cerrar sorteos en estado ACTIVO');

    raffle.close();
    await this.repo.saveRaffle(raffle);

    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    return result!;
  }
}
