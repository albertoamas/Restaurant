import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { ReopenRaffleUseCase } from './reopen-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

const PRIZES = [{ position: 1, prizeDescription: 'Premio' }];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH',
    productId: 'prod-1', spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES,
  });
  if (status === 'CLOSED')  r.close();
  if (status === 'DRAWING') { r.close(); r.startDrawing(); }
  if (status === 'DRAWN')   { r.close(); r.finishDrawing(); }
  return r;
}

describe('ReopenRaffleUseCase', () => {
  let useCase: ReopenRaffleUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new ReopenRaffleUseCase(repo);
    repo.changeStatus.mockResolvedValue();
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
  });

  it('reabre un sorteo CLOSED correctamente', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    await useCase.execute('r1', 'tenant-1');
    expect(repo.changeStatus).toHaveBeenCalledWith('r1', 'tenant-1', 'CLOSED', 'ACTIVE');
  });

  it('propaga el conflicto si el sorteo empezó a registrar ganadores mientras tanto', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    repo.changeStatus.mockRejectedValue(new ConflictException('cambió'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(ConflictException);
  });

  it('lanza NotFoundException si no existe el sorteo', async () => {
    repo.findRaffleById.mockResolvedValue(null);
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si el sorteo está ACTIVE (no cerrado)', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si el sorteo está DRAWING', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si el sorteo ya está DRAWN', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });
});
