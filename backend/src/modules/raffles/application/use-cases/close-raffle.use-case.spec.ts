import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CloseRaffleUseCase } from './close-raffle.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo', 'prod-1');
  if (status === 'CLOSED') r.close();
  if (status === 'DRAWN')  { r.close(); r.draw('c', 't'); }
  return r;
}

describe('CloseRaffleUseCase', () => {
  let useCase: CloseRaffleUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new CloseRaffleUseCase(repo);
    repo.saveRaffle.mockResolvedValue({} as any);
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
  });

  it('cierra un sorteo ACTIVE correctamente', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));
    await useCase.execute('r1', 'tenant-1');
    expect(repo.saveRaffle).toHaveBeenCalledTimes(1);
    const saved = repo.saveRaffle.mock.calls[0][0];
    expect(saved.status).toBe('CLOSED');
  });

  it('lanza NotFoundException si no existe el sorteo', async () => {
    repo.findRaffleById.mockResolvedValue(null);
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si el sorteo ya está CLOSED', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si el sorteo ya está DRAWN', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });
});
