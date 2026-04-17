import { Inject, Injectable } from '@nestjs/common';
import { RaffleDto } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class ListRafflesUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  execute(tenantId: string): Promise<RaffleDto[]> {
    return this.repo.findAllRaffles(tenantId);
  }
}
