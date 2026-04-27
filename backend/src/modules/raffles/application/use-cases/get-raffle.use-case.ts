import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDetailDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class GetRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDetailDto> {
    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    if (!result) throw new NotFoundException(`Sorteo ${id} no encontrado`);
    return result;
  }
}
