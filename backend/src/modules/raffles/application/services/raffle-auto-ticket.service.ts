import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort, NewTicketInput } from '../../domain/ports/raffle-repository.port';

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
      const item = items.find((i) => i.productId === raffle.productId);
      if (!item) continue;

      const now = new Date();
      const inputs: NewTicketInput[] = Array.from({ length: item.quantity }, () => ({
        id: uuidv4(),
        tenantId,
        raffleId: raffle.id,
        customerId,
        orderId,
        createdAt: now,
      }));

      await this.repo.addTickets(raffle.id, inputs);
    }
  }
}
