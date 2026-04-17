import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RaffleDto, RaffleTicketDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class GetRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<RaffleDto & { tickets: RaffleTicketDto[] }> {
    const result = await this.repo.findRaffleWithTickets(id, tenantId);
    if (!result) throw new NotFoundException(`Raffle ${id} not found`);
    return result;
  }
}
