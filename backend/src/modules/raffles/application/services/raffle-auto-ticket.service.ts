import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RaffleTicketsRevokedPayload, SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort, NewTicketInput } from '../../domain/ports/raffle-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class RaffleAutoTicketService {
  private readonly logger = new Logger(RaffleAutoTicketService.name);

  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  /**
   * Asigna tickets automáticamente tras crear una orden.
   *
   * PRODUCT_MATCH: emite N tickets por cada item cuyo productId coincida con un sorteo activo.
   * SPENDING_THRESHOLD: registra el aporte del pedido al gasto del cliente y emite los tickets que
   * ese gasto le faltaba.
   */
  async processOrder(
    tenantId: string,
    customerId: string,
    orderId: string,
    items: Array<{ productId: string; quantity: number }>,
    orderTotal: number,
  ): Promise<void> {
    await Promise.all([
      this.processProductMatchTickets(tenantId, customerId, orderId, items),
      this.processSpendingThresholdTickets(tenantId, customerId, orderId, orderTotal),
    ]);
  }

  /**
   * Retira lo que un pedido cancelado otorgó: sus tickets PRODUCT_MATCH y su aporte de gasto en los
   * sorteos SPENDING_THRESHOLD (con los tickets que ese aporte ya no cubre). Solo actúa mientras
   * el sorteo no haya empezado a sortearse.
   */
  async cancelOrderTickets(tenantId: string, orderId: string): Promise<void> {
    const revoked = await this.repo.revokeOrderTickets(tenantId, orderId);
    if (!revoked.length) return;

    this.logger.log(`Tickets retirados orderId=${orderId} tenantId=${tenantId} cantidad=${revoked.length}`);

    const raffleIds = new Set(revoked.map((t) => t.raffleId));
    for (const raffleId of raffleIds) {
      const deliveredTicketNumbers = revoked
        .filter((t) => t.raffleId === raffleId && t.delivered)
        .map((t) => t.ticketNumber);
      if (deliveredTicketNumbers.length) {
        this.logger.warn(
          `Tickets ya entregados retirados raffleId=${raffleId} orderId=${orderId} numeros=${deliveredTicketNumbers.join(',')}`,
        );
      }
      const payload: RaffleTicketsRevokedPayload = { raffleId, deliveredTicketNumbers };
      this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, payload);
    }
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private async processProductMatchTickets(
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

      const issued = await this.repo.addTickets(raffle.id, inputs);
      if (issued) this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: raffle.id });
    }
  }

  private async processSpendingThresholdTickets(
    tenantId: string,
    customerId: string,
    orderId: string,
    orderTotal: number,
  ): Promise<void> {
    const spendingRaffles = await this.repo.findActiveSpendingRaffles(tenantId);

    for (const raffle of spendingRaffles) {
      const issued = await this.repo.applyOrderSpending({
        tenantId,
        raffleId: raffle.id,
        customerId,
        orderId,
        amount: orderTotal,
      });
      if (issued > 0) this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId: raffle.id });
    }
  }
}
