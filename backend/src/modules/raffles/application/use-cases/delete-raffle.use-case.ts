import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class DeleteRaffleUseCase {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const raffle = await this.repo.findRaffleById(id, tenantId);
    if (!raffle) throw new NotFoundException(`Raffle ${id} not found`);
    if (!raffle.isDeletable) throw new BadRequestException('No se puede eliminar un sorteo ya sorteado');

    await this.repo.deleteRaffle(id, tenantId);
  }
}
