import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { ReopenRaffleUseCase } from './reopen-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

const PRIZES = [{ position: 1, prizeDescription: 'Premio' }];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo', 'prod-1', 1, PRIZES);
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
    repo.saveRaffle.mockResolvedValue({} as any);
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
  });

  it('reabre un sorteo CLOSED correctamente', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    await useCase.execute('r1', 'tenant-1');
    const saved = repo.saveRaffle.mock.calls[0][0];
    expect(saved.status).toBe('ACTIVE');
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
