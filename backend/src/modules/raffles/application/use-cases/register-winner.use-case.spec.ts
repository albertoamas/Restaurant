import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { RegisterWinnerUseCase } from './register-winner.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';
import { EventsService } from '../../../events/events.service';

const PRIZES_3 = [
  { position: 1, prizeDescription: '1er lugar' },
  { position: 2, prizeDescription: '2do lugar' },
  { position: 3, prizeDescription: '3er lugar' },
];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'CLOSED', winners = 3): Raffle {
  const r = Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'CATEGORY_MATCH', productId: null, categoryIds: ['cat-1'],
    spendingThreshold: null, numberOfWinners: winners, prizes: PRIZES_3.slice(0, winners),
  });
  if (status === 'CLOSED')  r.close();
  if (status === 'DRAWING') { r.close(); r.startDrawing(); }
  if (status === 'DRAWN')   { r.close(); r.finishDrawing(); }
  return r;
}

function makeWinner(position: number, customerId: string, voided = false): RaffleWinner {
  return RaffleWinner.reconstitute({
    id: `w-${position}`, tenantId: 'tenant-1', raffleId: 'r1', customerId, ticketId: `ticket-of-${customerId}`,
    position, prizeDescription: null, drawnAt: new Date(), voided, voidedAt: null, voidedBy: null, voidReason: null,
  });
}

describe('RegisterWinnerUseCase', () => {
  let useCase: RegisterWinnerUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    events  = mock<EventsService>();
    useCase = new RegisterWinnerUseCase(repo, events);

    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED'));
    repo.findTicketByNumber.mockResolvedValue({ id: 'ticket-9', customerId: 'cust-9' });
    repo.findWinnersByRaffleId.mockResolvedValue([]);
    repo.addWinnerAtomic.mockResolvedValue();
    repo.findRaffleWithTickets.mockResolvedValue({ id: 'r1', tickets: [] } as never);
  });

  describe('registro del ganador', () => {
    it('registra el último puesto primero, con el cliente del ticket y el premio de ese puesto', async () => {
      await useCase.execute('r1', 'tenant-1', 9);

      expect(repo.findTicketByNumber).toHaveBeenCalledWith('r1', 'tenant-1', 9);
      const [raffleId, tenantId, winner, status] = repo.addWinnerAtomic.mock.calls[0];
      expect([raffleId, tenantId]).toEqual(['r1', 'tenant-1']);
      expect(winner).toMatchObject({ position: 3, customerId: 'cust-9', ticketId: 'ticket-9', prizeDescription: '3er lugar', voided: false });
      expect(status).toBe('DRAWING');
    });

    it('un sorteo de un solo ganador queda DRAWN de inmediato', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));

      await useCase.execute('r1', 'tenant-1', 9);

      expect(repo.addWinnerAtomic.mock.calls[0][2].position).toBe(1);
      expect(repo.addWinnerAtomic.mock.calls[0][3]).toBe('DRAWN');
    });

    it('sigue con el puesto siguiente cuando ya hay ganadores activos', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(3, 'cust-3')]);

      await useCase.execute('r1', 'tenant-1', 9);

      expect(repo.addWinnerAtomic.mock.calls[0][2].position).toBe(2);
      expect(repo.addWinnerAtomic.mock.calls[0][3]).toBe('DRAWING');
    });

    it('el último puesto que falta deja el sorteo en DRAWN', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(3, 'cust-3'), makeWinner(2, 'cust-2')]);

      await useCase.execute('r1', 'tenant-1', 9);

      expect(repo.addWinnerAtomic.mock.calls[0][2].position).toBe(1);
      expect(repo.addWinnerAtomic.mock.calls[0][3]).toBe('DRAWN');
    });

    it('un ganador anulado deja su puesto libre para volver a registrarlo', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(3, 'cust-3'), makeWinner(2, 'cust-2', true)]);

      await useCase.execute('r1', 'tenant-1', 9);

      expect(repo.addWinnerAtomic.mock.calls[0][2].position).toBe(2);
    });

    it('el cliente de un ganador anulado vuelve a poder ganar', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(3, 'cust-9', true)]);

      await useCase.execute('r1', 'tenant-1', 9);

      expect(repo.addWinnerAtomic).toHaveBeenCalledTimes(1);
    });

    it('devuelve el sorteo actualizado y avisa a los dueños', async () => {
      const result = await useCase.execute('r1', 'tenant-1', 9);

      expect(result).toEqual({ id: 'r1', tickets: [] });
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_UPDATED, { id: 'r1', tickets: [] });
    });
  });

  describe('errores', () => {
    it('NotFoundException si no existe el sorteo', async () => {
      repo.findRaffleById.mockResolvedValue(null);

      await expect(useCase.execute('r1', 'tenant-1', 9)).rejects.toThrow(NotFoundException);
      expect(repo.addWinnerAtomic).not.toHaveBeenCalled();
    });

    it('BadRequestException si el sorteo sigue ACTIVE: hay que cerrarlo antes', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE'));

      await expect(useCase.execute('r1', 'tenant-1', 9)).rejects.toThrow('Cierra el sorteo antes de registrar');
      expect(repo.findTicketByNumber).not.toHaveBeenCalled();
      expect(repo.addWinnerAtomic).not.toHaveBeenCalled();
    });

    it('BadRequestException si el sorteo ya fue completado (DRAWN)', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));

      await expect(useCase.execute('r1', 'tenant-1', 9)).rejects.toThrow(BadRequestException);
      expect(repo.addWinnerAtomic).not.toHaveBeenCalled();
    });

    it('NotFoundException con el número si el ticket no existe en el sorteo', async () => {
      repo.findTicketByNumber.mockResolvedValue(null);

      await expect(useCase.execute('r1', 'tenant-1', 77)).rejects.toThrow('#77 no existe');
      expect(repo.addWinnerAtomic).not.toHaveBeenCalled();
    });

    it('BadRequestException si todos los puestos ya tienen ganador activo (defensivo)', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING', 2));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(2, 'cust-2'), makeWinner(1, 'cust-1')]);

      await expect(useCase.execute('r1', 'tenant-1', 9)).rejects.toThrow('todas las posiciones');
      expect(repo.addWinnerAtomic).not.toHaveBeenCalled();
    });

    it('rechaza a un cliente que ya ganó, aunque el ticket sea otro, e indica su puesto', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWING'));
      repo.findWinnersByRaffleId.mockResolvedValue([makeWinner(3, 'cust-9')]);

      await expect(useCase.execute('r1', 'tenant-1', 9)).rejects.toThrow('ya ganó el puesto 3');
      expect(repo.addWinnerAtomic).not.toHaveBeenCalled();
    });
  });
});
