import { Inject, Injectable } from '@nestjs/common';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { RaffleTicket } from '../../domain/entities/raffle-ticket.entity';

@Injectable()
export class RaffleAutoTicketService {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  async cancelOrderTickets(tenantId: string, orderId: string): Promise<void> {
    await this.repo.deleteTicketsByOrderId(tenantId, orderId);
  }

  async processOrder(
    tenantId: string,
    customerId: string,
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    const productIds = items.map((i) => i.productId);
    const activeRaffles = await this.repo.findActiveRafflesForProducts(tenantId, productIds);
    if (!activeRaffles.length) return;

    for (const raffle of activeRaffles) {
      if (!raffle.productId) continue;
      const item = items.find((i) => i.productId === raffle.productId);
      if (!item) continue;

      const baseNumber = await this.repo.getNextTicketNumber(raffle.id);
      const tickets = Array.from({ length: item.quantity }, (_, i) =>
        RaffleTicket.create({
          tenantId,
          raffleId: raffle.id,
          customerId,
          ticketNumber: baseNumber + i,
          orderId,
        }),
      );
      await this.repo.addTickets(tickets);
    }
  }
}
