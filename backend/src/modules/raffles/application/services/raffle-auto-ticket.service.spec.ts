import { mock, MockProxy } from 'jest-mock-extended';
import { SOCKET_EVENTS } from '@pos/shared';
import { RaffleAutoTicketService } from './raffle-auto-ticket.service';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { OrderTicketSnapshot, Raffle } from '../../domain/entities/raffle.entity';
import { EventsService } from '../../../events/events.service';

const PRIZES = [{ position: 1, prizeDescription: 'Premio' }];
const CREATED_AT = new Date('2026-10-18T15:00:00Z');

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

function makeOrder(overrides: Partial<OrderTicketSnapshot> = {}): OrderTicketSnapshot {
  return {
    orderId: 'order-1', customerId: 'cust-1', total: 120, createdAt: CREATED_AT, awardsTickets: true,
    items: [{ productId: 'prod-1', quantity: 1 }],
    ...overrides,
  };
}

describe('RaffleAutoTicketService.syncOrder()', () => {
  let service: RaffleAutoTicketService;
  let repo: MockProxy<RaffleRepositoryPort>;
  let events: MockProxy<EventsService>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    events  = mock<EventsService>();
    service = new RaffleAutoTicketService(repo, events);

    repo.revokeOrderTickets.mockResolvedValue([]);
    repo.findProductCategoryIds.mockResolvedValue(new Map([['prod-1', 'cat-1']]));
    repo.findActiveItemRaffles.mockResolvedValue([]);
    repo.findActiveSpendingRaffles.mockResolvedValue([]);
    repo.topUpItemTickets.mockResolvedValue(0);
    repo.applyOrderSpending.mockResolvedValue(0);
  });

  describe('qué se conserva y qué se retira', () => {
    it('conserva los tickets del cliente del pedido y retira los de cualquier otro', async () => {
      await service.syncOrder('tenant-1', makeOrder());

      expect(repo.revokeOrderTickets).toHaveBeenCalledWith('tenant-1', 'order-1', 'cust-1');
    });

    it.each([
      ['cancelado o cobrado como cortesía', { awardsTickets: false }],
      ['sin cliente', { customerId: null }],
    ])('pedido %s: retira todo y no otorga nada', async (_label, overrides) => {
      repo.findActiveItemRaffles.mockResolvedValue([makeProductRaffle('prod-1')]);
      repo.findActiveSpendingRaffles.mockResolvedValue([makeSpendingRaffle(100)]);

      await service.syncOrder('tenant-1', makeOrder(overrides));

      expect(repo.revokeOrderTickets).toHaveBeenCalledWith('tenant-1', 'order-1', null);
      expect(repo.topUpItemTickets).not.toHaveBeenCalled();
      expect(repo.applyOrderSpending).not.toHaveBeenCalled();
    });

    it('avisa a los dueños de cada sorteo afectado e informa qué tickets impresos sacar del ánfora', async () => {
      repo.revokeOrderTickets.mockResolvedValue([
        { raffleId: 'r1', ticketNumber: 4, printed: true },
        { raffleId: 'r1', ticketNumber: 5, printed: false },
        { raffleId: 'r2', ticketNumber: 9, printed: false },
      ]);

      await service.syncOrder('tenant-1', makeOrder({ awardsTickets: false }));

      expect(events.emitToOwners).toHaveBeenCalledTimes(2);
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, {
        raffleId: 'r1', printedTicketNumbers: [4],
      });
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, {
        raffleId: 'r2', printedTicketNumbers: [],
      });
    });

    it('no avisa si no había nada que retirar', async () => {
      await service.syncOrder('tenant-1', makeOrder({ awardsTickets: false }));

      expect(events.emitToOwners).not.toHaveBeenCalled();
    });
  });

  describe('sorteos por producto o categorías', () => {
    it('busca los sorteos con los productos, las categorías y la fecha del pedido', async () => {
      repo.findProductCategoryIds.mockResolvedValue(new Map([['prod-1', 'cat-1'], ['prod-2', 'cat-2']]));

      await service.syncOrder('tenant-1', makeOrder({
        items: [{ productId: 'prod-1', quantity: 1 }, { productId: 'prod-2', quantity: 1 }],
      }));

      expect(repo.findProductCategoryIds).toHaveBeenCalledWith('tenant-1', ['prod-1', 'prod-2']);
      expect(repo.findActiveItemRaffles).toHaveBeenCalledWith('tenant-1', ['prod-1', 'prod-2'], ['cat-1', 'cat-2'], CREATED_AT);
    });

    it('pide un ticket por unidad en un sorteo por producto, para el cliente y el pedido', async () => {
      const raffle = makeProductRaffle('prod-1');
      repo.findActiveItemRaffles.mockResolvedValue([raffle]);

      await service.syncOrder('tenant-1', makeOrder({ items: [{ productId: 'prod-1', quantity: 3 }] }));

      expect(repo.topUpItemTickets).toHaveBeenCalledWith({
        tenantId: 'tenant-1', raffleId: raffle.id, customerId: 'cust-1', orderId: 'order-1', expected: 3,
      });
    });

    it('pedido de ejemplo: 2 hamburguesas, 1 milanesa y 1 soda en un sorteo de ambas categorías esperan 3 tickets', async () => {
      const raffle = makeCategoryRaffle('cat-hamburguesas', 'cat-milanesas');
      repo.findProductCategoryIds.mockResolvedValue(new Map([
        ['hamburguesa-simple', 'cat-hamburguesas'], ['milanesa-napolitana', 'cat-milanesas'], ['soda', 'cat-bebidas'],
      ]));
      repo.findActiveItemRaffles.mockResolvedValue([raffle]);

      await service.syncOrder('tenant-1', makeOrder({
        items: [
          { productId: 'hamburguesa-simple', quantity: 2 },
          { productId: 'milanesa-napolitana', quantity: 1 },
          { productId: 'soda', quantity: 1 },
        ],
      }));

      expect(repo.topUpItemTickets).toHaveBeenCalledWith(expect.objectContaining({ raffleId: raffle.id, expected: 3 }));
    });

    it('suma las líneas cuando el mismo producto llega más de una vez', async () => {
      repo.findActiveItemRaffles.mockResolvedValue([makeProductRaffle('prod-1')]);

      await service.syncOrder('tenant-1', makeOrder({
        items: [{ productId: 'prod-1', quantity: 2 }, { productId: 'prod-2', quantity: 5 }, { productId: 'prod-1', quantity: 3 }],
      }));

      expect(repo.topUpItemTickets).toHaveBeenCalledWith(expect.objectContaining({ expected: 5 }));
    });

    it('un producto que ya no existe no cuenta para un sorteo por categorías', async () => {
      repo.findProductCategoryIds.mockResolvedValue(new Map());
      repo.findActiveItemRaffles.mockResolvedValue([makeCategoryRaffle('cat-1')]);

      await service.syncOrder('tenant-1', makeOrder({ items: [{ productId: 'borrado', quantity: 2 }] }));

      expect(repo.topUpItemTickets).not.toHaveBeenCalled();
    });

    it('no pide tickets en un sorteo que ninguna línea cumple', async () => {
      repo.findActiveItemRaffles.mockResolvedValue([makeCategoryRaffle('cat-otra')]);

      await service.syncOrder('tenant-1', makeOrder());

      expect(repo.topUpItemTickets).not.toHaveBeenCalled();
    });

    it('avisa a los dueños solo si se emitieron tickets', async () => {
      const issuing = makeProductRaffle('prod-1');
      const full = makeCategoryRaffle('cat-1');
      repo.findActiveItemRaffles.mockResolvedValue([issuing, full]);
      repo.topUpItemTickets.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

      await service.syncOrder('tenant-1', makeOrder());

      expect(events.emitToOwners).toHaveBeenCalledTimes(1);
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: issuing.id });
    });
  });

  describe('sorteos por monto', () => {
    it('suma el total vigente del pedido en cada sorteo por monto y busca con la fecha del pedido', async () => {
      const r1 = makeSpendingRaffle(100);
      const r2 = makeSpendingRaffle(50);
      repo.findActiveSpendingRaffles.mockResolvedValue([r1, r2]);

      await service.syncOrder('tenant-1', makeOrder({ total: 250 }));

      expect(repo.findActiveSpendingRaffles).toHaveBeenCalledWith('tenant-1', CREATED_AT);
      expect(repo.applyOrderSpending).toHaveBeenCalledWith({
        tenantId: 'tenant-1', raffleId: r1.id, customerId: 'cust-1', orderId: 'order-1', amount: 250,
      });
      expect(repo.applyOrderSpending).toHaveBeenCalledWith({
        tenantId: 'tenant-1', raffleId: r2.id, customerId: 'cust-1', orderId: 'order-1', amount: 250,
      });
    });

    it('avisa a los dueños solo del sorteo que emitió tickets', async () => {
      const r1 = makeSpendingRaffle(100);
      const r2 = makeSpendingRaffle(500);
      repo.findActiveSpendingRaffles.mockResolvedValue([r1, r2]);
      repo.applyOrderSpending.mockResolvedValueOnce(2).mockResolvedValueOnce(0);

      await service.syncOrder('tenant-1', makeOrder({ total: 250 }));

      expect(events.emitToOwners).toHaveBeenCalledTimes(1);
      expect(events.emitToOwners).toHaveBeenCalledWith('tenant-1', SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: r1.id });
    });
  });

  describe('resiliencia', () => {
    it('nunca lanza: un fallo del repositorio no debe frenar la venta', async () => {
      repo.revokeOrderTickets.mockRejectedValue(new Error('db caída'));

      await expect(service.syncOrder('tenant-1', makeOrder())).resolves.toBeUndefined();
    });

    it('un fallo al otorgar por producto no deja a medias el resto: se detiene y la próxima conciliación lo corrige', async () => {
      repo.findActiveItemRaffles.mockRejectedValue(new Error('db caída'));

      await expect(service.syncOrder('tenant-1', makeOrder())).resolves.toBeUndefined();
      expect(repo.applyOrderSpending).not.toHaveBeenCalled();
    });
  });
});
