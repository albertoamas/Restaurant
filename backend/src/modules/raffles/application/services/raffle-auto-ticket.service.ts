import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RAFFLE_REPOSITORY_PORT, RaffleRepositoryPort, NewTicketInput } from '../../domain/ports/raffle-repository.port';

export interface CancelTicketsOptions {
  /** customerId de la orden cancelada — necesario para revertir gasto acumulado. */
  customerId?: string;
  /** Total de la orden cancelada en Bs — necesario para revertir gasto acumulado. */
  orderTotal?: number;
}

@Injectable()
export class RaffleAutoTicketService {
  constructor(
    @Inject(RAFFLE_REPOSITORY_PORT)
    private readonly repo: RaffleRepositoryPort,
  ) {}

  /**
   * Asigna tickets automáticamente tras crear una orden.
   *
   * PRODUCT_MATCH: emite N tickets por cada item cuyo productId coincida con un sorteo activo.
   * SPENDING_THRESHOLD: acumula el total de la orden y emite tickets cuando se cruzan umbrales.
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
      this.processSpendingThresholdTickets(tenantId, customerId, orderTotal),
    ]);
  }

  /**
   * Revierte tickets al cancelar una orden.
   * Para PRODUCT_MATCH borra tickets por orderId.
   * Para SPENDING_THRESHOLD resta el monto del acumulado y borra tickets en exceso.
   */
  async cancelOrderTickets(
    tenantId: string,
    orderId: string,
    opts?: CancelTicketsOptions,
  ): Promise<void> {
    await this.repo.deleteTicketsByOrderId(tenantId, orderId);

    if (opts?.customerId && opts?.orderTotal) {
      await this.revertSpendingTickets(tenantId, opts.customerId, opts.orderTotal);
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

      await this.repo.addTickets(raffle.id, inputs);
    }
  }

  private async processSpendingThresholdTickets(
    tenantId: string,
    customerId: string,
    orderTotal: number,
  ): Promise<void> {
    const spendingRaffles = await this.repo.findActiveSpendingRaffles(tenantId);
    if (!spendingRaffles.length) return;

    for (const raffle of spendingRaffles) {
      const threshold = raffle.spendingThreshold!;

      const { newTotal } = await this.repo.addCustomerSpending(tenantId, raffle.id, customerId, orderTotal);
      const ticketsEarned = Math.floor(newTotal / threshold);

      const existingCount = await this.repo.countTicketsByCustomer(tenantId, raffle.id, customerId);
      const toEmit = ticketsEarned - existingCount;
      if (toEmit <= 0) continue;

      const now = new Date();
      const inputs: NewTicketInput[] = Array.from({ length: toEmit }, () => ({
        id: uuidv4(),
        tenantId,
        raffleId: raffle.id,
        customerId,
        orderId: null,
        createdAt: now,
      }));

      await this.repo.addTickets(raffle.id, inputs);
    }
  }

  private async revertSpendingTickets(
    tenantId: string,
    customerId: string,
    orderTotal: number,
  ): Promise<void> {
    const spendingRaffles = await this.repo.findActiveSpendingRaffles(tenantId);
    if (!spendingRaffles.length) return;

    for (const raffle of spendingRaffles) {
      const threshold = raffle.spendingThreshold!;

      const { newTotal } = await this.repo.subtractCustomerSpending(tenantId, raffle.id, customerId, orderTotal);
      const ticketsEarned = Math.floor(newTotal / threshold);

      const existingCount = await this.repo.countTicketsByCustomer(tenantId, raffle.id, customerId);
      const excess = existingCount - ticketsEarned;
      if (excess <= 0) continue;

      await this.repo.deleteExcessTicketsByCustomer(tenantId, raffle.id, customerId, excess);
    }
  }
}
