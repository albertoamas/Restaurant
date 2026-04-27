import { mock, MockProxy } from 'jest-mock-extended';
import { RaffleAutoTicketService } from './raffle-auto-ticket.service';
import { NewTicketInput, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { Raffle } from '../../domain/entities/raffle.entity';

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

  beforeEach(() => {
    repo    = mock<RaffleRepositoryPort>();
    service = new RaffleAutoTicketService(repo);
    repo.addTickets.mockResolvedValue();
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
    it('emite 1 ticket cuando el total supera el umbral por primera vez', async () => {
      const raffle = makeSpendingRaffle(100);
      repo.findActiveSpendingRaffles.mockResolvedValue([raffle]);
      repo.addCustomerSpending.mockResolvedValue({ newTotal: 100 });
      repo.countTicketsByCustomer.mockResolvedValue(0);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 100);

      expect(repo.addCustomerSpending).toHaveBeenCalledWith('tenant-1', raffle.id, 'cust-1', 100);
      expect(repo.addTickets).toHaveBeenCalledTimes(1);
      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(1);
      expect(inputs[0].orderId).toBeNull();
    });

    it('emite 2 tickets cuando el total cruza dos umbrales de golpe', async () => {
      const raffle = makeSpendingRaffle(100);
      repo.findActiveSpendingRaffles.mockResolvedValue([raffle]);
      repo.addCustomerSpending.mockResolvedValue({ newTotal: 250 });
      repo.countTicketsByCustomer.mockResolvedValue(0);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 250);

      const [, inputs] = repo.addTickets.mock.calls[0] as [string, NewTicketInput[]];
      expect(inputs).toHaveLength(2);
    });

    it('no emite tickets cuando el total no alcanza el umbral', async () => {
      const raffle = makeSpendingRaffle(100);
      repo.findActiveSpendingRaffles.mockResolvedValue([raffle]);
      repo.addCustomerSpending.mockResolvedValue({ newTotal: 80 });
      repo.countTicketsByCustomer.mockResolvedValue(0);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 80);

      expect(repo.addTickets).not.toHaveBeenCalled();
    });

    it('no emite tickets si ya los tiene todos asignados (idempotente)', async () => {
      const raffle = makeSpendingRaffle(100);
      repo.findActiveSpendingRaffles.mockResolvedValue([raffle]);
      repo.addCustomerSpending.mockResolvedValue({ newTotal: 200 });
      repo.countTicketsByCustomer.mockResolvedValue(2); // ya tiene 2

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 100);

      expect(repo.addTickets).not.toHaveBeenCalled();
    });

    it('no llama a addCustomerSpending si no hay sorteos spending activos', async () => {
      repo.findActiveSpendingRaffles.mockResolvedValue([]);

      await service.processOrder('tenant-1', 'cust-1', 'order-1', [], 500);

      expect(repo.addCustomerSpending).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrderTickets()', () => {
    it('llama a deleteTicketsByOrderId con los parámetros correctos', async () => {
      repo.deleteTicketsByOrderId.mockResolvedValue();

      await service.cancelOrderTickets('tenant-1', 'order-1');

      expect(repo.deleteTicketsByOrderId).toHaveBeenCalledWith('tenant-1', 'order-1');
    });

    it('revierte gasto acumulado cuando se proveen customerId y orderTotal', async () => {
      const raffle = makeSpendingRaffle(100);
      repo.deleteTicketsByOrderId.mockResolvedValue();
      repo.findActiveSpendingRaffles.mockResolvedValue([raffle]);
      repo.subtractCustomerSpending.mockResolvedValue({ newTotal: 50 });
      repo.countTicketsByCustomer.mockResolvedValue(1);

      await service.cancelOrderTickets('tenant-1', 'order-1', {
        customerId: 'cust-1',
        orderTotal: 50,
      });

      expect(repo.subtractCustomerSpending).toHaveBeenCalledWith('tenant-1', raffle.id, 'cust-1', 50);
    });

    it('borra tickets en exceso cuando el revertido baja por debajo del umbral', async () => {
      const raffle = makeSpendingRaffle(100);
      repo.deleteTicketsByOrderId.mockResolvedValue();
      repo.findActiveSpendingRaffles.mockResolvedValue([raffle]);
      // Antes de revertir: total 200 → 2 tickets; tras revertir 150: total 50 → 0 tickets
      repo.subtractCustomerSpending.mockResolvedValue({ newTotal: 50 });
      repo.countTicketsByCustomer.mockResolvedValue(2);
      repo.deleteExcessTicketsByCustomer.mockResolvedValue();

      await service.cancelOrderTickets('tenant-1', 'order-1', {
        customerId: 'cust-1',
        orderTotal: 150,
      });

      expect(repo.deleteExcessTicketsByCustomer).toHaveBeenCalledWith('tenant-1', raffle.id, 'cust-1', 2);
    });

    it('no revierte spending cuando opts está ausente', async () => {
      repo.deleteTicketsByOrderId.mockResolvedValue();

      await service.cancelOrderTickets('tenant-1', 'order-1');

      expect(repo.subtractCustomerSpending).not.toHaveBeenCalled();
      expect(repo.findActiveSpendingRaffles).not.toHaveBeenCalled();
    });
  });
});
