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

function makeCategoryRaffle(...categoryIds: string[]): Raffle {
  return Raffle.create({
    tenantId: 'tenant-1', name: 'Por categorías', ticketMode: 'CATEGORY_MATCH',
    productId: null, categoryIds, spendingThreshold: null, numberOfWinners: 1, prizes: PRIZES,
  });
}

function makeSpendingRaffle(threshold: number): Raffle {
  return Raffle.create({
    tenantId: 'tenant-1', name: 'Acumulativo', ticketMode: 'SPENDING_THRESHOLD',
    productId: null, spendingThreshold: threshold, numberOfWinners: 1, prizes: PRIZES,
  });
}

const line = (productId: string, categoryId: string, quantity: number) => ({ productId, categoryId, quantity });

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
    repo.findActiveItemRaffles.mockResolvedValue([]);
  });

  describe('processOrder() — sorteos por producto o categoría', () => {
    it('busca los sorteos con los productos y categorías del pedido', async () => {
      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        line('prod-1', 'cat-1', 1), line('prod-2', 'cat-2', 1),
      ], 100);

      expect(repo.findActiveItemRaffles).toHaveBeenCalledWith('tenant-1', ['prod-1', 'prod-2'], ['cat-1', 'cat-2']);
    });

    it('un ticket por unidad en un sorteo por producto, a nombre del cliente y ligado al pedido', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveItemRaffles.mockResolvedValue([raffle]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [line('prod-1', 'cat-1', 3)], 300);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const [raffleId, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(raffleId).toBe(raffle.id);
      expect(inputs).toHaveLength(3);
      expect(inputs.every((t) => t.customerId === 'cust-1' && t.orderId === 'order-1' && t.tenantId === 'tenant-1')).toBe(true);
      expect(new Set(inputs.map((t) => t.id)).size).toBe(3);
    });

    it('pedido de ejemplo: 2 hamburguesas, 1 milanesa y 1 soda en un sorteo de ambas categorías dan 3 tickets', async () => {
      repo.findActiveItemRaffles.mockResolvedValue([makeCategoryRaffle('cat-hamburguesas', 'cat-milanesas')]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        line('hamburguesa-simple', 'cat-hamburguesas', 2),
        line('milanesa-napolitana', 'cat-milanesas', 1),
        line('soda', 'cat-bebidas', 1),
      ], 120);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(3);
    });

    it('suma las líneas cuando el mismo producto llega más de una vez', async () => {
      repo.findActiveItemRaffles.mockResolvedValue([makeProductRaffle('prod-1')]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        line('prod-1', 'cat-1', 2), line('prod-2', 'cat-2', 5), line('prod-1', 'cat-1', 3),
      ], 500);

      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(5);
    });

    it('emite en cada sorteo que corresponde, con sus propias cantidades', async () => {
      const byProduct = makeProductRaffle('prod-1');
      const byCategory = makeCategoryRaffle('cat-2');
      repo.findActiveItemRaffles.mockResolvedValue([byProduct, byCategory]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        line('prod-1', 'cat-1', 1), line('prod-2', 'cat-2', 2),
      ], 300);

      const calls = repo.addTickets.mock.calls as [string, NewTicketInput[]][];
      expect(calls).toHaveLength(2);
      expect(calls[0][0]).toBe(byProduct.id);
      expect(calls[0][1]).toHaveLength(1);
      expect(calls[1][0]).toBe(byCategory.id);
      expect(calls[1][1]).toHaveLength(2);
    });

    it('no emite en un sorteo que ninguna línea cumple', async () => {
      repo.findActiveItemRaffles.mockResolvedValue([makeCategoryRaffle('cat-1')]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [line('soda', 'cat-bebidas', 2)], 20);

      expect(repo.addTickets).not.toHaveBeenCalled();
      expect(events.emitToOwners).not.toHaveBeenCalled();
    });

    it('no hace nada si no hay sorteos activos que apliquen', async () => {
      await service.processOrder('tenant-1', 'cust-1', 'order-1', [line('prod-1', 'cat-1', 2)], 200);

      expect(repo.addTickets).not.toHaveBeenCalled();
    });

    it('avisa a los dueños cuando se emitieron tickets', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveItemRaffles.mockResolvedValue([raffle]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [line('prod-1', 'cat-1', 1)], 100);

      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: raffle.id });
    });

    it('no avisa si el sorteo ya no estaba ACTIVE y no se emitió nada', async () => {
      repo.findActiveItemRaffles.mockResolvedValue([makeProductRaffle('prod-1')]);
      repo.addTickets.mockResolvedValue(false);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [line('prod-1', 'cat-1', 1)], 100);

      expect(events.emitToOwners).not.toHaveBeenCalled();
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
