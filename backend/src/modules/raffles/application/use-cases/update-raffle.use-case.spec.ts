import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UpdateRaffleUseCase } from './update-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';

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

function makeWinner(position: number, voided = false): RaffleWinner {
  return RaffleWinner.reconstitute({
    id: `winner-${position}`, tenantId: 'tenant-1', raffleId: 'r1', customerId: `cust-${position}`,
    ticketId: `ticket-${position}`, position, prizeDescription: `${position} lugar`,
    drawnAt: new Date(), voided, voidedAt: null, voidedBy: null, voidReason: null,
  });
}

describe('UpdateRaffleUseCase', () => {
  let useCase: UpdateRaffleUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new UpdateRaffleUseCase(repo);
    repo.findRaffleById.mockResolvedValue(makeRaffle());
    repo.findWinnersByRaffleId.mockResolvedValue([]);
    repo.updateRaffle.mockResolvedValue();
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1' } as never);
  });

  it('lanza NotFoundException si no existe el sorteo', async () => {
    repo.findRaffleById.mockResolvedValue(null);

    await expect(useCase.execute('r1', 'tenant-1', { name: 'Nuevo' })).rejects.toThrow(NotFoundException);
    expect(repo.updateRaffle).not.toHaveBeenCalled();
  });

  it('actualiza nombre y descripción sin consultar ganadores', async () => {
    await useCase.execute('r1', 'tenant-1', { name: '  Nuevo  ', description: ' Desc ' });

    expect(repo.updateRaffle).toHaveBeenCalledWith('r1', 'tenant-1', { name: 'Nuevo', description: 'Desc', prizes: undefined });
    expect(repo.findWinnersByRaffleId).not.toHaveBeenCalled();
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

  it('lanza BadRequestException si el puesto ya tiene un ganador activo', async () => {
    repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(1)]);

    await expect(
      useCase.execute('r1', 'tenant-1', { prizes: [{ position: 1, prizeDescription: 'Otro premio' }] }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.updateRaffle).not.toHaveBeenCalled();
  });

  it('permite cambiar el premio de un puesto cuyo ganador fue anulado', async () => {
    repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(1, true)]);
    const prizes = [{ position: 1, prizeDescription: 'Otro premio' }];

    await useCase.execute('r1', 'tenant-1', { prizes });

    expect(repo.updateRaffle).toHaveBeenCalled();
  });
});
