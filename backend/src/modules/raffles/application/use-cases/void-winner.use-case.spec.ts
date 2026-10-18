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
  const r = Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH',
    productId: 'prod-1', spendingThreshold: null, numberOfWinners: 2, prizes: PRIZES,
  });
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
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    ...overrides,
  });
}

const execute = (useCase: VoidWinnerUseCase) =>
  useCase.execute('r1', 'winner-1', 'tenant-1', 'user-1', 'Cliente no se presentó');

describe('VoidWinnerUseCase', () => {
  let useCase: VoidWinnerUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new VoidWinnerUseCase(repo);
    repo.voidWinnerAtomic.mockResolvedValue();
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as any);
  });

  describe('anulación desde DRAWN', () => {
    it('anula al ganador y pide pasar el sorteo de DRAWN a DRAWING en la misma operación atómica', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner()]);

      await execute(useCase);

      expect(repo.voidWinnerAtomic).toHaveBeenCalledTimes(1);
      const [winner, newStatus] = repo.voidWinnerAtomic.mock.calls[0];
      expect(winner.id).toBe('winner-1');
      expect(newStatus).toBe('DRAWING');
      expect(repo.saveRaffle).not.toHaveBeenCalled();
    });
  });

  describe('anulación desde DRAWING', () => {
    it('anula al ganador y el sorteo permanece en DRAWING', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner()]);

      await execute(useCase);

      expect(repo.voidWinnerAtomic.mock.calls[0][1]).toBe('DRAWING');
    });
  });

  describe('auditoría', () => {
    it('registra quién anuló, cuándo y por qué', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner()]);

      await execute(useCase);

      const winner = repo.voidWinnerAtomic.mock.calls[0][0];
      expect(winner.voided).toBe(true);
      expect(winner.voidedBy).toBe('user-1');
      expect(winner.voidReason).toBe('Cliente no se presentó');
      expect(winner.voidedAt).toBeInstanceOf(Date);
    });
  });

  describe('errores de validación', () => {
    it('lanza NotFoundException si el sorteo no existe', async () => {
      repo.findRaffleById.mockResolvedValue(null);

      await expect(execute(useCase)).rejects.toThrow(NotFoundException);
      expect(repo.voidWinnerAtomic).not.toHaveBeenCalled();
    });

    it.each(['ACTIVE', 'CLOSED'] as const)('lanza BadRequestException si el sorteo está %s', async (status) => {
      repo.findRaffleById.mockResolvedValue(makeRaffle(status));

      await expect(execute(useCase)).rejects.toThrow(BadRequestException);
      expect(repo.voidWinnerAtomic).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el winner no existe en el sorteo', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
      repo.findWinnersByRaffleId.mockResolvedValue([]);

      await expect(execute(useCase)).rejects.toThrow(NotFoundException);
      expect(repo.voidWinnerAtomic).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el winner ya está anulado', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner({ voided: true })]);

      await expect(execute(useCase)).rejects.toThrow(NotFoundException);
      expect(repo.voidWinnerAtomic).not.toHaveBeenCalled();
    });
  });
});
