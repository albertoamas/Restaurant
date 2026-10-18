import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { RaffleTicketsRevokedPayload, SOCKET_EVENTS } from '@pos/shared';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';
import { OrderTicketItem, OrderTicketSnapshot } from '../../domain/entities/raffle.entity';
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
   * Concilia los tickets con lo que el pedido otorga hoy. Se llama al crearlo y cada vez que cambia
   * algo que los afecta (se agregan productos, cambia el cliente, se cancela, se cobra como cortesía).
   *
   * Es idempotente: retira lo que ya no corresponde (otro cliente, cancelado, cortesía) y completa lo
   * que falta, así que repetirlo no duplica nada. Nunca lanza: un fallo aquí no debe frenar la venta;
   * se registra y la próxima conciliación del pedido lo corrige.
   */
  async syncOrder(tenantId: string, order: OrderTicketSnapshot): Promise<void> {
    try {
      const customerId = order.awardsTickets ? order.customerId : null;
      await this.revokeTickets(tenantId, order.orderId, customerId);
      if (customerId === null) return;

      await this.awardItemTickets(tenantId, customerId, order);
      await this.awardSpendingTickets(tenantId, customerId, order);
    } catch (err) {
      this.logger.error(
        `syncOrder failed orderId=${order.orderId} tenantId=${tenantId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  /** Retira los tickets de otros clientes (o de todos si no se conserva ninguno) y avisa a los dueños. */
  private async revokeTickets(tenantId: string, orderId: string, keepCustomerId: string | null): Promise<void> {
    const revoked = await this.repo.revokeOrderTickets(tenantId, orderId, keepCustomerId);
    if (!revoked.length) return;

    this.logger.log(`Tickets retirados orderId=${orderId} tenantId=${tenantId} cantidad=${revoked.length}`);

    for (const raffleId of new Set(revoked.map((t) => t.raffleId))) {
      const printedTicketNumbers = revoked
        .filter((t) => t.raffleId === raffleId && t.printed)
        .map((t) => t.ticketNumber);
      if (printedTicketNumbers.length) {
        this.logger.warn(
          `Tickets ya impresos retirados raffleId=${raffleId} orderId=${orderId} numeros=${printedTicketNumbers.join(',')}`,
        );
      }
      const payload: RaffleTicketsRevokedPayload = { raffleId, printedTicketNumbers };
      this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_TICKETS_REVOKED, payload);
    }
  }

  /** Sorteos por producto o categorías: un ticket por unidad que cumple la regla. */
  private async awardItemTickets(tenantId: string, customerId: string, order: OrderTicketSnapshot): Promise<void> {
    const productIds = order.items.map((i) => i.productId);
    const categoryOf = await this.repo.findProductCategoryIds(tenantId, productIds);
    // Un producto que ya no existe no tiene categoría: no cuenta para ningún sorteo.
    const items: OrderTicketItem[] = order.items.map((i) => ({ ...i, categoryId: categoryOf.get(i.productId) ?? '' }));

    const raffles = await this.repo.findActiveItemRaffles(tenantId, productIds, [...new Set(categoryOf.values())], order.createdAt);
    for (const raffle of raffles) {
      const expected = raffle.ticketsForItems(items);
      if (expected === 0) continue;

      const issued = await this.repo.topUpItemTickets({
        tenantId, raffleId: raffle.id, customerId, orderId: order.orderId, expected,
      });
      if (issued > 0) this.emitTicketAdded(tenantId, raffle.id);
    }
  }

  /** Sorteos por monto: el total del pedido suma al gasto del cliente. */
  private async awardSpendingTickets(tenantId: string, customerId: string, order: OrderTicketSnapshot): Promise<void> {
    const raffles = await this.repo.findActiveSpendingRaffles(tenantId, order.createdAt);
    for (const raffle of raffles) {
      const issued = await this.repo.applyOrderSpending({
        tenantId, raffleId: raffle.id, customerId, orderId: order.orderId, amount: order.total,
      });
      if (issued > 0) this.emitTicketAdded(tenantId, raffle.id);
    }
  }

  private emitTicketAdded(tenantId: string, raffleId: string): void {
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.RAFFLE_TICKET_ADDED, { raffleId });
  }
}
