import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class ReopenRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDto> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Sorteo ${id} no encontrado`);
    if (!raffle.isReopenable) {
      throw new BadRequestException(
        'Solo se pueden reabrir sorteos en estado CERRADO (no los que están en sorteo o ya terminados)',
      );
    }

    raffle.reopen();
    await this.repo.saveRaffle(raffle);

    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    return result!;
  }
}
