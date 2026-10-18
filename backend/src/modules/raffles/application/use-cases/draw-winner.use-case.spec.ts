import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { DrawWinnerUseCase } from './draw-winner.use-case';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import type { RaffleWinnerDto } from '@pos/shared';

const PRIZES_3 = [
  { position: 1, prizeDescription: '1er lugar' },
  { position: 2, prizeDescription: '2do lugar' },
  { position: 3, prizeDescription: '3er lugar' },
];

function makeRaffle(status: 'ACTIVE' | 'CLOSED' | 'DRAWING' | 'DRAWN' = 'CLOSED', winners = 3): Raffle {
  const r = Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH',
    productId: 'prod-1', spendingThreshold: null, numberOfWinners: winners,
    prizes: PRIZES_3.slice(0, winners),
  });
  if (status === 'CLOSED')  r.close();
  if (status === 'DRAWING') { r.close(); r.startDrawing(); }
  if (status === 'DRAWN')   { r.close(); r.finishDrawing(); }
  return r;
}

function makeTickets(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `ticket-${i}`,
    customerId: `cust-${i}`,
    ticketNumber: i + 1,
    raffleId: 'r1',
    orderId: null,
    customer: { id: `cust-${i}`, name: `Cliente ${i}`, phone: null },
    createdAt: new Date().toISOString(),
  }));
}

/** Crea un RaffleWinnerDto para embeber en findRaffleWithTickets. El cliente sale del ticket (ticket-N es de cust-N). */
function makeWinnerDto(overrides: Partial<RaffleWinnerDto> = {}): RaffleWinnerDto {
  const ticketId = overrides.ticketId ?? 'ticket-0';
  const customerId = ticketId.replace('ticket-', 'cust-');
  return {
    id: 'winner-1',
    tenantId: 'tenant-1',
    raffleId: 'r1',
    customerId,
    customer: { id: customerId, name: `Cliente ${customerId}`, phone: null },
    ticketId,
    ticketNumber: 1,
    position: 3,
    prizeDescription: '3er lugar',
    drawnAt: new Date().toISOString(),
    voided: false,
    ...overrides,
  } as RaffleWinnerDto;
}

describe('DrawWinnerUseCase', () => {
  let useCase: DrawWinnerUseCase;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    useCase = new DrawWinnerUseCase(repo);
    repo.drawWinnerAtomic.mockResolvedValue();
  });

  describe('sorteo de primera posición', () => {
    it('sortea el 3er lugar primero y queda en DRAWING cuando hay más posiciones', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 3));
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(5), winners: [], spendings: [] } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(5), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.position).toBe(3);
      const newStatus = repo.drawWinnerAtomic.mock.calls[0][3];
      expect(newStatus).toBe('DRAWING');
    });

    it('sorteo de 1 ganador — posición 1, queda DRAWN directamente', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(3), winners: [], spendings: [] } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(3), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.position).toBe(1);
      const newStatus = repo.drawWinnerAtomic.mock.calls[0][3];
      expect(newStatus).toBe('DRAWN');
    });
  });

  describe('secuencia completa de 3 draws', () => {
    it('2do draw sortea posición 2 cuando posición 3 ya tiene ganador activo', async () => {
      const raffle = makeRaffle('DRAWING', 3);
      repo.findRaffleById.mockResolvedValue(raffle);
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', tickets: makeTickets(5), spendings: [],
          winners: [makeWinnerDto({ ticketId: 'ticket-0', position: 3 })],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(5), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.position).toBe(2);
      expect(winner.ticketId).not.toBe('ticket-0');
      const newStatus = repo.drawWinnerAtomic.mock.calls[0][3];
      expect(newStatus).toBe('DRAWING');
    });

    it('3er draw sortea posición 1 y transiciona a DRAWN', async () => {
      const raffle = makeRaffle('DRAWING', 3);
      repo.findRaffleById.mockResolvedValue(raffle);
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', tickets: makeTickets(5), spendings: [],
          winners: [
            makeWinnerDto({ ticketId: 'ticket-0', position: 3 }),
            makeWinnerDto({ id: 'w2', ticketId: 'ticket-1', position: 2 }),
          ],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(5), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.position).toBe(1);
      const newStatus = repo.drawWinnerAtomic.mock.calls[0][3];
      expect(newStatus).toBe('DRAWN');
    });
  });

  describe('lógica de pool con ganadores anulados', () => {
    it('el ticket de un ganador anulado vuelve al pool disponible', async () => {
      const raffle = makeRaffle('DRAWING', 3);
      repo.findRaffleById.mockResolvedValue(raffle);
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', tickets: makeTickets(3), spendings: [],
          winners: [
            makeWinnerDto({ ticketId: 'ticket-0', position: 3, voided: true }),
            makeWinnerDto({ id: 'w2', ticketId: 'ticket-1', position: 2, voided: false }),
          ],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(3), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.ticketId).not.toBe('ticket-1');
      expect(['ticket-0', 'ticket-2']).toContain(winner.ticketId);
    });

    it('nextPosition apunta a la posición más alta sin ganador activo (hueco por void)', async () => {
      const raffle = makeRaffle('DRAWING', 3);
      repo.findRaffleById.mockResolvedValue(raffle);
      // pos 3 activo, pos 2 anulado → nextPosition debe ser 2
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', tickets: makeTickets(5), spendings: [],
          winners: [
            makeWinnerDto({ ticketId: 'ticket-0', position: 3, voided: false }),
            makeWinnerDto({ id: 'w2', ticketId: 'ticket-1', position: 2, voided: true }),
          ],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(5), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.position).toBe(2);
    });

    it('con dos posiciones anuladas, el draw va al hueco de posición más alta', async () => {
      const raffle = makeRaffle('DRAWING', 3);
      repo.findRaffleById.mockResolvedValue(raffle);
      // pos 1 activo, pos 3 y 2 anulados → nextPosition = 3
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', tickets: makeTickets(5), spendings: [],
          winners: [
            makeWinnerDto({ ticketId: 'ticket-0', position: 1, voided: false }),
            makeWinnerDto({ id: 'w2', ticketId: 'ticket-1', position: 3, voided: true }),
            makeWinnerDto({ id: 'w3', ticketId: 'ticket-2', position: 2, voided: true }),
          ],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(5), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.position).toBe(3);
    });

    it('al completar tras void+redraw transiciona a DRAWN', async () => {
      const raffle = makeRaffle('DRAWING', 2);
      repo.findRaffleById.mockResolvedValue(raffle);
      // pos 2 activo, pos 1 anulado → redraw pos 1 → DRAWN
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', tickets: makeTickets(4), spendings: [],
          winners: [
            makeWinnerDto({ ticketId: 'ticket-0', position: 2, voided: false }),
            makeWinnerDto({ id: 'w2', ticketId: 'ticket-1', position: 1, voided: true }),
          ],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(4), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const newStatus = repo.drawWinnerAtomic.mock.calls[0][3];
      expect(newStatus).toBe('DRAWN');
    });
  });

  describe('datos del ganador creado', () => {
    it('asigna tenantId y raffleId correctos al ganador', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.tenantId).toBe('tenant-1');
      expect(winner.raffleId).toBe('r1');
    });

    it('asigna la prizeDescription correcta según la posición', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.prizeDescription).toBe('1er lugar');
    });

    it('el ganador tiene voided en false por defecto', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.voided).toBe(false);
    });
  });

  describe('errores', () => {
    it('lanza NotFoundException si no existe el sorteo', async () => {
      repo.findRaffleById.mockResolvedValue(null);
      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el sorteo ya fue completado (DRAWN)', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('DRAWN'));
      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(repo.drawWinnerAtomic).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el sorteo sigue ACTIVE: hay que cerrarlo antes de sortear', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('ACTIVE', 1));
      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow('Cierra el sorteo antes de sortear');
      expect(repo.findRaffleWithTickets).not.toHaveBeenCalled();
      expect(repo.drawWinnerAtomic).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el sorteo no tiene tickets', async () => {
      repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));
      repo.findRaffleWithTickets.mockResolvedValueOnce({ id: 'r1', tickets: [], winners: [], spendings: [] } as any);
      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(repo.drawWinnerAtomic).not.toHaveBeenCalled();
    });

    it('un cliente con varios tickets que ya ganó queda fuera del ánfora con todos sus tickets', async () => {
      const raffle = makeRaffle('DRAWING', 2);
      repo.findRaffleById.mockResolvedValue(raffle);
      const tickets = [
        { ...makeTickets(1)[0], id: 'ticket-0a', customerId: 'cust-0' },
        { ...makeTickets(1)[0], id: 'ticket-0b', customerId: 'cust-0' },
      ];
      repo.findRaffleWithTickets.mockResolvedValueOnce({
        id: 'r1', spendings: [], tickets,
        winners: [makeWinnerDto({ ticketId: 'ticket-0a', customerId: 'cust-0', position: 2 })],
      } as any);

      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow('cada cliente gana un solo premio');
      expect(repo.drawWinnerAtomic).not.toHaveBeenCalled();
    });

    it('sortea solo entre clientes que aún no ganaron', async () => {
      const raffle = makeRaffle('DRAWING', 2);
      repo.findRaffleById.mockResolvedValue(raffle);
      const tickets = [
        { ...makeTickets(1)[0], id: 'ticket-0a', customerId: 'cust-0' },
        { ...makeTickets(1)[0], id: 'ticket-0b', customerId: 'cust-0' },
        { ...makeTickets(1)[0], id: 'ticket-1a', customerId: 'cust-1' },
      ];
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', spendings: [], tickets,
          winners: [makeWinnerDto({ ticketId: 'ticket-0a', customerId: 'cust-0', position: 2 })],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets, winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      const winner = repo.drawWinnerAtomic.mock.calls[0][2];
      expect(winner.customerId).toBe('cust-1');
      expect(winner.ticketId).toBe('ticket-1a');
    });

    it('el cliente de un ganador anulado vuelve a participar', async () => {
      const raffle = makeRaffle('DRAWING', 2);
      repo.findRaffleById.mockResolvedValue(raffle);
      const tickets = [{ ...makeTickets(1)[0], id: 'ticket-0', customerId: 'cust-0' }];
      repo.findRaffleWithTickets
        .mockResolvedValueOnce({
          id: 'r1', spendings: [], tickets,
          winners: [makeWinnerDto({ ticketId: 'ticket-0', customerId: 'cust-0', position: 1, voided: true })],
        } as any)
        .mockResolvedValueOnce({ id: 'r1', tickets, winners: [], spendings: [] } as any);

      await useCase.execute('r1', 'tenant-1');

      expect(repo.drawWinnerAtomic.mock.calls[0][2].customerId).toBe('cust-0');
    });

    it('lanza BadRequestException si todos los tickets activos ya ganaron', async () => {
      const raffle = makeRaffle('DRAWING', 2);
      repo.findRaffleById.mockResolvedValue(raffle);
      repo.findRaffleWithTickets.mockResolvedValueOnce({
        id: 'r1', spendings: [],
        tickets: [makeTickets(1)[0]],
        winners: [makeWinnerDto({ ticketId: 'ticket-0', position: 2, voided: false })],
      } as any);

      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(repo.drawWinnerAtomic).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si todas las posiciones ya tienen ganador activo (race condition defensiva)', async () => {
      // Escenario: 2 ganadores de 2 posiciones, ambos activos — missingPositions = []
      const raffle = makeRaffle('DRAWING', 2);
      repo.findRaffleById.mockResolvedValue(raffle);
      repo.findRaffleWithTickets.mockResolvedValueOnce({
        id: 'r1', spendings: [],
        tickets: makeTickets(5),
        winners: [
          makeWinnerDto({ ticketId: 'ticket-0', position: 2, voided: false }),
          makeWinnerDto({ id: 'w2', ticketId: 'ticket-1', position: 1, voided: false }),
        ],
      } as any);

      await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(BadRequestException);
      expect(repo.drawWinnerAtomic).not.toHaveBeenCalled();
    });
  });

  // Aseguramos que findWinnersByRaffleId ya no se llama en el flujo normal
  it('no llama a findWinnersByRaffleId en ningún caso', async () => {
    repo.findRaffleById.mockResolvedValue(makeRaffle('CLOSED', 1));
    repo.findRaffleWithTickets
      .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any)
      .mockResolvedValueOnce({ id: 'r1', tickets: makeTickets(2), winners: [], spendings: [] } as any);

    await useCase.execute('r1', 'tenant-1');

    expect(repo.findWinnersByRaffleId).not.toHaveBeenCalled();
  });
});
