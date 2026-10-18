import { ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UpdateRaffleUseCase } from './update-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

const PRIZES = [
  { position: 1, prizeDescription: '1er lugar' },
  { position: 2, prizeDescription: '2do lugar' },
];

function makeRaffle(): Raffle {
  return Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH',
    productId: 'prod-1', spendingThreshold: null, numberOfWinners: 2, prizes: PRIZES,
  });
}

describe('UpdateRaffleUseCase', () => {
  let useCase: UpdateRaffleUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new UpdateRaffleUseCase(repo);
    repo.findRaffleById.mockResolvedValue(makeRaffle());
    repo.updateRaffle.mockResolvedValue();
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1' } as never);
  });

  it('lanza NotFoundException si no existe el sorteo', async () => {
    repo.findRaffleById.mockResolvedValue(null);

    await expect(useCase.execute('r1', 'tenant-1', { name: 'Nuevo' })).rejects.toThrow(NotFoundException);
    expect(repo.updateRaffle).not.toHaveBeenCalled();
  });

  it('actualiza nombre y descripción', async () => {
    await useCase.execute('r1', 'tenant-1', { name: '  Nuevo  ', description: ' Desc ' });

    expect(repo.updateRaffle).toHaveBeenCalledWith('r1', 'tenant-1', { name: 'Nuevo', description: 'Desc', prizes: undefined });
  });

  it('propaga el conflicto del repositorio si el puesto ya tiene ganador', async () => {
    repo.updateRaffle.mockRejectedValue(new ConflictException('El premio del puesto 1 ya tiene ganador'));

    await expect(
      useCase.execute('r1', 'tenant-1', { prizes: [{ position: 1, prizeDescription: 'Otro' }] }),
    ).rejects.toThrow('ya tiene ganador');
    expect(repo.findRaffleWithTickets).not.toHaveBeenCalled();
  });

  it('actualiza el premio de un puesto sin ganador', async () => {
    const prizes = [{ position: 2, prizeDescription: 'Cena para dos' }];

    await useCase.execute('r1', 'tenant-1', { prizes });

    expect(repo.updateRaffle).toHaveBeenCalledWith('r1', 'tenant-1', expect.objectContaining({ prizes }));
  });

  it('lanza BadRequestException si el puesto no existe en el sorteo', async () => {
    await expect(
      useCase.execute('r1', 'tenant-1', { prizes: [{ position: 5, prizeDescription: 'X' }] }),
    ).rejects.toThrow('no existe en este sorteo');
    expect(repo.updateRaffle).not.toHaveBeenCalled();
  });
});
