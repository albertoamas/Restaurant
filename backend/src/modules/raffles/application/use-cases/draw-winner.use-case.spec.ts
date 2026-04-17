import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DrawWinnerUseCase } from './draw-winner.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWN' = 'ACTIVE'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo', 'prod-1');
  if (status === 'CLOSED') r.close();
  if (status === 'DRAWN')  { r.close(); r.draw('c', 't'); }
  return r;
}

function makeTickets(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `ticket-${i}`,
    customerId: `cust-${i}`,
    ticketNumber: i + 1,
  }));
}

describe('DrawWinnerUseCase', () => {
  let useCase: DrawWinnerUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new DrawWinnerUseCase(repo);
    repo.saveRaffle.mockResolvedValue({} as any);
  });

  it('elige un ganador cuando hay tickets y el sorteo es ACTIVE', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));
    repo.findRaffleWithTickets
      .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(3) } as any)
      .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(3), winnerTicketId: 'ticket-0' } as any);

    const result = await useCase.execute('r1', 'tenant-1');
    expect(repo.saveRaffle).toHaveBeenCalledTimes(1);
    const saved = repo.saveRaffle.mock.calls[0][0];
    expect(saved.status).toBe('DRAWN');
    expect(saved.winnerCustomerId).toMatch(/^cust-/);
    expect(result).toBeDefined();
  });

  it('también funciona con un sorteo CLOSED', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    repo.findRaffleWithTickets
      .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(1) } as any)
      .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(1) } as any);

    await expect(useCase.execute('r1', 'tenant-1')).resolves.toBeDefined();
  });

  it('lanza NotFoundException si no existe el sorteo', async () => {
    repo.findRaffleById.mockResolvedValue(null);
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('lanza BadRequestException si el sorteo ya fue sorteado', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });

  it('lanza BadRequestException si el sorteo no tiene tickets', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
    await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
  });
});
