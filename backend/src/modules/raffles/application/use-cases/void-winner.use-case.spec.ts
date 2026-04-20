import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { VoidWinnerUseCase } from './void-winner.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';

const PRIZES = [
  { position: 1, prizeDescription: '1er lugar' },
  { position: 2, prizeDescription: '2do lugar' },
];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'DRAWN'): Raffle {
  const r = Raffle.create('tenant-1', 'Sorteo', 'prod-1', 2, PRIZES);
  if (status === 'CLOSED')  r.close();
  if (status === 'DRAWING') { r.close(); r.startDrawing(); }
  if (status === 'DRAWN')   { r.close(); r.finishDrawing(); }
  return r;
}

function makeWinner(overrides: Partial<RaffleWinner> = {}): RaffleWinner {
  return RaffleWinner.reconstitute({
    id: 'winner-1',
    tenantId: 'tenant-1',
    raffleId: 'r1',
    customerId: 'cust-1',
    ticketId: 'ticket-1',
    position: 1,
    prizeDescription: '1er lugar',
    drawnAt: new Date(),
    voided: false,
    ...overrides,
  });
}

describe('VoidWinnerUseCase', () => {
  let useCase: VoidWinnerUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new VoidWinnerUseCase(repo);
    repo.voidWinner.mockResolvedValue();
    repo.saveRaffle.mockResolvedValue({} as any);
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
  });

  describe('anulación desde DRAWN', () => {
    it('anula el ganador y transiciona el sorteo de DRAWN a DRAWING', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner()]);

      await useCase.execute('r1', 'winner-1', 'tenant-1');

      expect(repo.voidWinner).toHaveBeenCalledWith('winner-1', 'r1', 'tenant-1');
      const saved = repo.saveRaffle.mock.calls[0][0];
      expect(saved.status).toBe('DRAWING');
    });

    it('llama a saveRaffle cuando el sorteo estaba DRAWN', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner()]);

      await useCase.execute('r1', 'winner-1', 'tenant-1');

      expect(repo.saveRaffle).toHaveBeenCalledTimes(1);
    });
  });

  describe('anulación desde DRAWING', () => {
    it('anula el ganador y el sorteo permanece en DRAWING', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner()]);

      await useCase.execute('r1', 'winner-1', 'tenant-1');

      expect(repo.voidWinner).toHaveBeenCalledWith('winner-1', 'r1', 'tenant-1');
      expect(repo.saveRaffle).not.toHaveBeenCalled();
    });
  });

  describe('errores de validación', () => {
    it('lanza NotFoundException si el sorteo no existe', async () => {
      repo.findRaffleById.mockResolvedValue(null);

      await expect(useCase.execute('r1', 'winner-1', 'tenant-1')).rejects.toThrow(NotFoundException);
      expect(repo.voidWinner).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el sorteo está ACTIVE', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));

      await expect(useCase.execute('r1', 'winner-1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(repo.voidWinner).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el sorteo está CLOSED', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));

      await expect(useCase.execute('r1', 'winner-1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(repo.voidWinner).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el winner no existe en el sorteo', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
      repo.findWinnersByRaffleId.mockResolvedValue([]);

      await expect(useCase.execute('r1', 'winner-1', 'tenant-1')).rejects.toThrow(NotFoundException);
      expect(repo.voidWinner).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el winner ya está anulado', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([
        makeWinner({ voided: true }),
      ]);

      await expect(useCase.execute('r1', 'winner-1', 'tenant-1')).rejects.toThrow(NotFoundException);
      expect(repo.voidWinner).not.toHaveBeenCalled();
    });
  });
});
