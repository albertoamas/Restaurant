import { mock, MockProxy } from 'jest-mock-extended';
import { RaffleAutoTicketService } from './raffle-auto-ticket.service';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

const PRIZES = [{ position: 1, prizeDescription: 'Premio' }];

function makeActiveRaffle(productId: string): Raffle {
  return Raffle.create('tenant-1', 'Sorteo', productId, 1, PRIZES);
}

describe('RaffleAutoTicketService', () => {
  let service: RaffleAutoTicketService;
  let repo: MockProxy<RaffleRepositoryPort>;

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    service = new RaffleAutoTicketService(repo);
    repo.addTickets.mockResolvedValue([]);
  });

  describe('processOrder()', () => {
    it('crea un ticket cuando hay un sorteo activo con el producto del pedido', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeActiveRaffle('prod-1')]);
      repo.getNextTicketNumber.mockResolvedValue(1);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 1 },
      ]);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const tickets = repo.addTickets.mock.calls[0][0];
      expect(tickets).toHaveLength(1);
      expect(tickets[0].customerId).toBe('cust-1');
      expect(tickets[0].orderId).toBe('order-1');
      expect(tickets[0].ticketNumber).toBe(1);
    });

    it('crea un ticket por unidad pedida (qty=3 → tickets #1, #2, #3)', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeActiveRaffle('prod-1')]);
      repo.getNextTicketNumber.mockResolvedValue(1);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 3 },
      ]);

      const tickets = repo.addTickets.mock.calls[0][0];
      expect(tickets).toHaveLength(3);
      expect(tickets.map((t: any) => t.ticketNumber)).toEqual([1, 2, 3]);
    });

    it('continúa la numeración desde baseNumber > 1 (ej. base=5, qty=3 → #5, #6, #7)', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeActiveRaffle('prod-1')]);
      repo.getNextTicketNumber.mockResolvedValue(5);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 3 },
      ]);

      const tickets = repo.addTickets.mock.calls[0][0];
      expect(tickets.map((t: any) => t.ticketNumber)).toEqual([5, 6, 7]);
    });

    it('no hace nada si no hay sorteos activos', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 2 },
      ]);

      expect(repo.addTickets).not.toHaveBeenCalled();
    });

    it('procesa varios sorteos con distintos productos en el mismo pedido', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([
        makeActiveRaffle('prod-1'),
        makeActiveRaffle('prod-2'),
      ]);
      repo.getNextTicketNumber.mockResolvedValue(1);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 2 },
      ]);

      expect(repo.addTickets).toHaveBeenCalledTimes(2);
    });

    it('solo crea tickets para los productos con sorteo activo, ignora los demás', async () => {
      repo.findActiveRafflesForProducts.mockResolvedValue([makeActiveRaffle('prod-1')]);
      repo.getNextTicketNumber.mockResolvedValue(1);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-sin-sorteo', quantity: 3 },
      ]);

      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const tickets = repo.addTickets.mock.calls[0][0];
      expect(tickets).toHaveLength(1);
    });
  });

  describe('cancelOrderTickets()', () => {
    it('llama a deleteTicketsByOrderId con los parámetros correctos', async () => {
      repo.deleteTicketsByOrderId.mockResolvedValue();

      await service.cancelOrderTickets('tenant-1', 'order-1');

      expect(repo.deleteTicketsByOrderId).toHaveBeenCalledWith('tenant-1', 'order-1');
    });
  });
});
