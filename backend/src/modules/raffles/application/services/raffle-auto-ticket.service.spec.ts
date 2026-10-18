import { mock, MockProxy } from 'jest-mock-extended';
import { RaffleAutoTicketService } from './raffle-auto-ticket.service';
import { NewTicketInput, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';
import { EventsService } from '../../../events/events.service';
import { SOCKET_EVENTS } from '@pos/shared';

const PRIZES = [{ position: 1, prizeDescription: 'Premio' }];

function makeProductRaffle(productId: string): Raffle {
  return Raffle.create({
    tenantId: 'tenant-1', name: 'Sorteo', ticketMode: 'PRODUCT_MATCH',
    productId, spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES,
  });
}

function makeSpendingRaffle(threshold: number): Raffle {
  return Raffle.create({
    tenantId: 'tenant-1', name: 'Acumulativo', ticketMode: 'SPENDING_THRESHOLD',
    productId: null, spendingThreshold: threshold, numberOfWinners: 1, prizes: PRIZES,
  });
}

describe('RaffleAutoTicketService', () => {
  let service: RaffleAutoTicketService;
  let repo: MockProxy<RaffleRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    events  = mock<EventsService>();
    service = new RaffleAutoTicketService(repo, events);
    repo.addTickets.mockResolvedValue(true);
    repo.findActiveSpendingRaffles.mockResolvedValue([]);
    repo.findActiveRafflesForProducts.mockResolvedValue([]);
  });

  describe('processOrder() — PRODUCT_MATCH', () => {
    it('crea un input por unidad cuando hay un sorteo activo con el producto del pedido', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveRafflesForProducts.mockResolvedValue([raffle]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 1 },
      ], 100);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const [raffleId, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(raffleId).toBe(raffle.id);
      expect(inputs).toHaveLength(1);
      expect(inputs[0].customerId).toBe('cust-1');
      expect(inputs[0].orderId).toBe('order-1');
      expect(inputs[0].tenantId).toBe('tenant-1');
    });

    it('crea un input por unidad pedida (qty=3 → tres inputs)', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveRafflesForProducts.mockResolvedValue([raffle]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 3 },
      ], 300);

      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(3);
      expect(inputs.every((t) => t.customerId === 'cust-1')).toBe(true);
      expect(inputs.every((t) => t.orderId === 'order-1')).toBe(true);
    });

    it('cada input tiene un id único', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeProductRaffle('prod-1')]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 3 },
      ], 300);

      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      const ids = inputs.map((t) => t.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('suma las cantidades cuando el mismo producto llega en más de una línea', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeProductRaffle('prod-1')]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 5 },
        { productId: 'prod-1', quantity: 3 },
      ], 500);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(5);
    });

    it('avisa a los dueños cuando se emitieron tickets', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveRafflesForProducts.mockResolvedValue([raffle]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [{ productId: 'prod-1', quantity: 1 }], 100);

      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: raffle.id });
    });

    it('no avisa si el sorteo ya no estaba ACTIVE y no se emitió nada', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeProductRaffle('prod-1')]);
      repo.addTickets.mockResolvedValue(false);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [{ productId: 'prod-1', quantity: 1 }], 100);

      expect(events.emitToOwners).not.toHaveBeenCalled();
    });

    it('no hace nada si no hay sorteos activos de producto', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 2 },
      ], 200);

      expect(repo.addTickets).not.toHaveBeenCalled();
    });

    it('procesa varios sorteos con distintos productos en el mismo pedido', async () => {
      const r1 = makeProductRaffle('prod-1');
      const r2 = makeProductRaffle('prod-2');
      repo.findActiveRafflesForProducts.mockResolvedValue([r1, r2]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 2 },
      ], 300);

      expect(repo.addTickets).toHaveBeenCalledTimes(2);
      const calls = repo.addTickets.mock.calls as [string, NewTicketInput[]][];
      expect(calls[0][0]).toBe(r1.id);
      expect(calls[0][1]).toHaveLength(1);
      expect(calls[1][0]).toBe(r2.id);
      expect(calls[1][1]).toHaveLength(2);
    });

    it('solo crea tickets para los productos con sorteo activo, ignora los demás', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveRafflesForProducts.mockResolvedValue([raffle]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-sin-sorteo', quantity: 3 },
      ], 400);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(1);
    });
  });

  describe('processOrder() — SPENDING_THRESHOLD', () => {
    it('registra el aporte del pedido en cada sorteo de gasto activo', async () => {
      const r1 = makeSpendingRaffle(100);
      const r2 = makeSpendingRaffle(50);
      repo.findActiveSpendingRaffles.mockResolvedValue([r1, r2]);
      repo.applyOrderSpending.mockResolvedValue(0);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 120);

      expect(repo.applyOrderSpending).toHaveBeenCalledTimes(2);
      expect(repo.applyOrderSpending).toHaveBeenCalledWith({
        tenantId: 'tenant-1', raffleId: r1.id, customerId: 'cust-1', orderId: 'order-1', amount: 120,
      });
      expect(repo.applyOrderSpending).toHaveBeenCalledWith({
        tenantId: 'tenant-1', raffleId: r2.id, customerId: 'cust-1', orderId: 'order-1', amount: 120,
      });
    });

    it('avisa a los dueños solo del sorteo que emitió tickets', async () => {
      const r1 = makeSpendingRaffle(100);
      const r2 = makeSpendingRaffle(500);
      repo.findActiveSpendingRaffles.mockResolvedValue([r1, r2]);
      repo.applyOrderSpending.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 250);

      expect(events.emitToOwners).toHaveBeenCalledTimes(1);
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: r1.id });
    });

    it('no hace nada si no hay sorteos de gasto activos', async () => {
      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 500);

      expect(repo.applyOrderSpending).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrderTickets()', () => {
    it('retira los tickets del pedido y avisa a los dueños de cada sorteo afectado', async () => {
      repo.revokeOrderTickets.mockResolvedValue([
        { raffleId: 'r1', ticketNumber: 4, printed: false },
        { raffleId: 'r2', ticketNumber: 9, printed: false },
      ]);

      await service.cancelOrderTickets('tenant-1', 'order-1');

      expect(repo.revokeOrderTickets).toHaveBeenCalledWith('tenant-1', 'order-1');
      expect(events.emitToOwners).toHaveBeenCalledTimes(2);
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, {
        raffleId: 'r1', printedTicketNumbers: [],
      });
    });

    it('informa qué tickets ya impresos (en el ánfora) se retiraron', async () => {
      repo.revokeOrderTickets.mockResolvedValue([
        { raffleId: 'r1', ticketNumber: 4, printed: true },
        { raffleId: 'r1', ticketNumber: 5, printed: false },
      ]);

      await service.cancelOrderTickets('tenant-1', 'order-1');

      expect(events.emitToOwners).toHaveBeenCalledTimes(1);
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, {
        raffleId: 'r1', printedTicketNumbers: [4],
      });
    });

    it('no avisa a nadie si el pedido no había otorgado tickets', async () => {
      repo.revokeOrderTickets.mockResolvedValue([]);

      await service.cancelOrderTickets('tenant-1', 'order-1');

      expect(events.emitToOwners).not.toHaveBeenCalled();
    });
  });
});
