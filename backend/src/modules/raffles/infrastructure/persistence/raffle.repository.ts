import { randomUUID } from 'crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { RaffleDetailDto, RaffleDto, RaffleSpendingDto, RaffleTicketMode, RaffleWinnerDto } from '@pos/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DRAWABLE_STATUSES,
  Raffle,
  RafflePrize,
  RaffleProps,
  RaffleStatus,
  TICKET_REVOCABLE_STATUSES,
  WINNER_VOIDABLE_STATUSES,
  nextPositionToDraw,
  ticketsEarned,
} from '../../domain/entities/raffle.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';
import {
  NewTicketInput,
  OrderSpendingInput,
  RaffleRepositoryPort,
  RevokedTicket,
} from '../../domain/ports/raffle-repository.port';

const customerSelect = { select: { id: true, name: true, phone: true } } satisfies { select: Prisma.CustomerSelect };

/** Lo que muestra la lista de sorteos. */
const listInclude = {
  product: { select: { id: true, name: true } },
  categories: { include: { category: { select: { id: true, name: true } } } },
  prizes: { orderBy: { position: 'asc' } },
  winners: {
    include: { customer: customerSelect, ticket: { select: { ticketNumber: true } } },
    orderBy: { position: 'asc' },
  },
  _count: { select: { tickets: true } },
} satisfies Prisma.RaffleInclude;

/** Lista + tickets y gasto acumulado: el detalle de un sorteo. */
const detailInclude = {
  ...listInclude,
  tickets: { include: { customer: customerSelect }, orderBy: { ticketNumber: 'asc' } },
  customerSpendings: { include: { customer: customerSelect }, orderBy: { totalSpent: 'desc' } },
} satisfies Prisma.RaffleInclude;

/** Lo que necesita el dominio para reconstruir un sorteo. */
const domainInclude = {
  prizes: { orderBy: { position: 'asc' } },
  categories: { select: { categoryId: true } },
} satisfies Prisma.RaffleInclude;

type RaffleWithRelations = Prisma.RaffleGetPayload<{ include: typeof listInclude }>;
type RaffleWithTickets = Prisma.RaffleGetPayload<{ include: typeof detailInclude }>;

@Injectable()
export class RaffleRepository implements RaffleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Raffle ────────────────────────────────────────────────────────────────

  async createRaffle(raffle: Raffle): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.raffle.create({
        data: {
          id: raffle.id,
          tenantId: raffle.tenantId,
          name: raffle.name,
          description: raffle.description,
          status: raffle.status,
          numberOfWinners: raffle.numberOfWinners,
          ticketMode: raffle.ticketMode,
          spendingThreshold: raffle.spendingThreshold,
          productId: raffle.productId,
          createdAt: raffle.createdAt,
          updatedAt: raffle.updatedAt,
        },
      }),
      this.prisma.rafflePrize.createMany({
        data: raffle.prizes.map((p) => ({
          id: randomUUID(),
          raffleId: raffle.id,
          position: p.position,
          prizeDescription: p.prizeDescription,
        })),
      }),
      this.prisma.raffleCategory.createMany({
        data: raffle.categoryIds.map((categoryId) => ({ raffleId: raffle.id, categoryId, tenantId: raffle.tenantId })),
      }),
    ]);
  }

  async saveRaffle(raffle: Raffle): Promise<void> {
    await this.prisma.raffle.updateMany({
      where: { id: raffle.id, tenantId: raffle.tenantId },
      data: {
        name: raffle.name,
        description: raffle.description,
        status: raffle.status,
        numberOfWinners: raffle.numberOfWinners,
        productId: raffle.productId,
        updatedAt: raffle.updatedAt,
      },
    });
  }

  async findRaffleById(id: string, tenantId: string): Promise<Raffle | null> {
    const row = await this.prisma.raffle.findFirst({
      where: { id, tenantId },
      include: domainInclude,
    });
    return row ? this.raffleToDomain(row) : null;
  }

  async findAllRaffles(tenantId: string): Promise<RaffleDto[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId },
      include: listInclude,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => this.rowToRaffleDto(r));
  }

  async findRaffleWithTickets(id: string, tenantId: string): Promise<RaffleDetailDto | null> {
    const row = await this.prisma.raffle.findFirst({ where: { id, tenantId }, include: detailInclude });
    if (!row) return null;

    const threshold = row.spendingThreshold ?? 1;
    const spendings: RaffleSpendingDto[] = row.customerSpendings.map((s) => ({
      customerId: s.customerId,
      customer: { id: s.customer.id, name: s.customer.name, phone: s.customer.phone },
      totalSpent: Number(s.totalSpent),
      ticketsEarned: ticketsEarned(Number(s.totalSpent), threshold),
    }));

    return {
      ...this.rowToRaffleDto(row),
      tickets: row.tickets.map((t) => ({
        id: t.id,
        raffleId: t.raffleId,
        customerId: t.customerId,
        customer: { id: t.customer.id, name: t.customer.name, phone: t.customer.phone },
        ticketNumber: t.ticketNumber,
        orderId: t.orderId,
        printedAt: t.printedAt ? t.printedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      })),
      spendings,
    };
  }

  async findActiveItemRaffles(tenantId: string, productIds: string[], categoryIds: string[]): Promise<Raffle[]> {
    const rows = await this.prisma.raffle.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [
          { ticketMode: 'PRODUCT_MATCH', productId: { in: productIds } },
          { ticketMode: 'CATEGORY_MATCH', categories: { some: { categoryId: { in: categoryIds } } } },
        ],
      },
      include: domainInclude,
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

  async findActiveSpendingRaffles(tenantId: string): Promise<Raffle[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId, status: 'ACTIVE', ticketMode: 'SPENDING_THRESHOLD' },
      include: domainInclude,
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

  // ─── Bloqueo del sorteo ────────────────────────────────────────────────────

  /**
   * Bloquea la fila del sorteo hasta el fin de la transacción y devuelve lo que las reglas deben
   * leer ya bajo el bloqueo. Toda operación que cambia tickets, ganadores o estado empieza aquí:
   * así emitir, cancelar, cerrar, sortear y anular se serializan entre sí.
   */
  private async lockRaffle(
    tx: Prisma.TransactionClient,
    raffleId: string,
    tenantId: string,
  ): Promise<{ status: RaffleStatus; spendingThreshold: number | null } | null> {
    const rows = await tx.$queryRaw<Array<{ status: RaffleStatus; spending_threshold: number | null }>>`
      SELECT status, spending_threshold FROM raffles
      WHERE id = ${raffleId} AND tenant_id = ${tenantId}
      FOR UPDATE
    `;
    return rows[0] ? { status: rows[0].status, spendingThreshold: rows[0].spending_threshold } : null;
  }

  // ─── Tickets ───────────────────────────────────────────────────────────────

  async addTickets(raffleId: string, inputs: NewTicketInput[]): Promise<boolean> {
    if (!inputs.length) return false;

    return this.prisma.$transaction(async (tx) => {
      const raffle = await this.lockRaffle(tx, raffleId, inputs[0].tenantId);
      if (raffle?.status !== 'ACTIVE') return false;

      await this.insertTickets(tx, raffleId, inputs);
      return true;
    });
  }

  /** Inserta con números secuenciales. El llamador debe tener el sorteo bloqueado (`lockRaffle`). */
  private async insertTickets(
    tx: Prisma.TransactionClient,
    raffleId: string,
    inputs: NewTicketInput[],
  ): Promise<void> {
    const agg = await tx.raffleTicket.aggregate({
      where: { raffleId },
      _max: { ticketNumber: true },
    });
    const base = (agg._max.ticketNumber ?? 0) + 1;

    await tx.raffleTicket.createMany({
      data: inputs.map((t, i) => ({
        id: t.id,
        tenantId: t.tenantId,
        raffleId: t.raffleId,
        customerId: t.customerId,
        ticketNumber: base + i,
        orderId: t.orderId,
        createdAt: t.createdAt,
      })),
    });
  }

  // ─── Winners ───────────────────────────────────────────────────────────────

  async findWinnersByRaffleId(raffleId: string, tenantId: string): Promise<RaffleWinner[]> {
    const rows = await this.prisma.raffleWinner.findMany({
      where: { raffleId, tenantId },
      orderBy: { position: 'desc' },
    });
    return rows.map((r) =>
      RaffleWinner.reconstitute({
        id: r.id,
        tenantId: r.tenantId,
        raffleId: r.raffleId,
        customerId: r.customerId,
        ticketId: r.ticketId,
        position: r.position,
        prizeDescription: r.prizeDescription,
        drawnAt: r.drawnAt,
        voided: r.voided,
        voidedAt: r.voidedAt,
        voidedBy: r.voidedBy,
        voidReason: r.voidReason,
      }),
    );
  }

  async findTicketByNumber(
    raffleId: string,
    tenantId: string,
    ticketNumber: number,
  ): Promise<{ id: string; customerId: string } | null> {
    return this.prisma.raffleTicket.findFirst({
      where: { raffleId, tenantId, ticketNumber },
      select: { id: true, customerId: true },
    });
  }

  async addWinnerAtomic(id: string, tenantId: string, winner: RaffleWinner, newStatus: RaffleStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Re-verificar estado dentro de la transacción, ya con el sorteo bloqueado
      const raffle = await this.lockRaffle(tx, id, tenantId);
      if (!raffle || !DRAWABLE_STATUSES.includes(raffle.status)) {
        throw new ConflictException('El sorteo ya fue completado o está en estado inválido');
      }

      // El ticket pudo retirarse (pedido cancelado) entre que se buscó y se registra
      const ticket = await tx.raffleTicket.findFirst({
        where: { id: winner.ticketId, raffleId: id, tenantId },
        select: { id: true },
      });
      if (!ticket) {
        throw new ConflictException('El ticket ya no existe. Verifica el número');
      }

      // Verificar que esta posición no tenga ya un ganador activo
      const existing = await tx.raffleWinner.findFirst({
        where: { raffleId: id, position: winner.position, voided: false },
      });
      if (existing) {
        throw new ConflictException(`La posición ${winner.position} ya tiene un ganador activo`);
      }

      await tx.raffleWinner.create({
        data: {
          id: winner.id,
          tenantId: winner.tenantId,
          raffleId: winner.raffleId,
          customerId: winner.customerId,
          ticketId: winner.ticketId,
          position: winner.position,
          prizeDescription: winner.prizeDescription,
          drawnAt: winner.drawnAt,
          voided: false,
        },
      });

      await tx.raffle.updateMany({
        where: { id, tenantId },
        data: { status: newStatus, updatedAt: new Date() },
      });
    });
  }

  async voidWinnerAtomic(winner: RaffleWinner, newStatus: RaffleStatus): Promise<void> {
    const { raffleId, tenantId } = winner;

    await this.prisma.$transaction(async (tx) => {
      const raffle = await this.lockRaffle(tx, raffleId, tenantId);
      if (!raffle || !WINNER_VOIDABLE_STATUSES.includes(raffle.status)) {
        throw new ConflictException('El sorteo ya no admite anular ganadores');
      }

      const voided = await tx.raffleWinner.updateMany({
        where: { id: winner.id, raffleId, tenantId, voided: false },
        data: {
          voided: true,
          voidedAt: winner.voidedAt,
          voidedBy: winner.voidedBy,
          voidReason: winner.voidReason,
        },
      });
      if (voided.count === 0) throw new ConflictException('El ganador ya fue anulado');

      await tx.raffle.updateMany({
        where: { id: raffleId, tenantId },
        data: { status: newStatus, updatedAt: new Date() },
      });
    });
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async deleteRaffle(id: string, tenantId: string): Promise<void> {
    await this.prisma.raffle.deleteMany({ where: { id, tenantId } });
  }

  // ─── Gasto acumulado y retiro de tickets por pedido ────────────────────────

  async applyOrderSpending(input: OrderSpendingInput): Promise<number> {
    const { tenantId, raffleId, customerId, orderId, amount } = input;

    return this.prisma.$transaction(async (tx) => {
      const raffle = await this.lockRaffle(tx, raffleId, tenantId);
      if (raffle?.status !== 'ACTIVE' || raffle.spendingThreshold === null) return 0;

      // Un pedido suma una sola vez por sorteo: reintentar no duplica gasto ni tickets.
      const alreadyApplied = await tx.raffleOrderSpending.findUnique({
        where: { raffleId_orderId: { raffleId, orderId } },
        select: { id: true },
      });
      if (alreadyApplied) return 0;

      await tx.raffleOrderSpending.create({
        data: { id: randomUUID(), tenantId, raffleId, customerId, orderId, amount },
      });
      const spending = await tx.customerRaffleSpending.upsert({
        where: { raffleId_customerId: { raffleId, customerId } },
        create: { id: randomUUID(), tenantId, raffleId, customerId, totalSpent: amount },
        update: { totalSpent: { increment: amount } },
      });

      const earned = ticketsEarned(Number(spending.totalSpent), raffle.spendingThreshold);
      const issued = await tx.raffleTicket.count({ where: { tenantId, raffleId, customerId } });
      const missing = earned - issued;
      if (missing <= 0) return 0;

      const now = new Date();
      await this.insertTickets(
        tx,
        raffleId,
        Array.from({ length: missing }, () => ({
          id: randomUUID(),
          tenantId,
          raffleId,
          customerId,
          orderId: null,
          createdAt: now,
        })),
      );
      return missing;
    });
  }

  async revokeOrderTickets(tenantId: string, orderId: string): Promise<RevokedTicket[]> {
    const inRevocableRaffle = { raffle: { status: { in: [...TICKET_REVOCABLE_STATUSES] } } };

    return this.prisma.$transaction(async (tx) => {
      const withTickets = await tx.raffleTicket.findMany({
        where: { tenantId, orderId, ...inRevocableRaffle },
        select: { raffleId: true },
        distinct: ['raffleId'],
      });
      const withSpending = await tx.raffleOrderSpending.findMany({
        where: { tenantId, orderId, ...inRevocableRaffle },
        select: { raffleId: true },
      });
      // Orden estable para tomar los bloqueos siempre en la misma secuencia
      const raffleIds = [...new Set([...withTickets, ...withSpending].map((r) => r.raffleId))].sort();

      const revoked: RevokedTicket[] = [];
      for (const raffleId of raffleIds) {
        // El estado pudo cambiar (sorteo iniciado) entre la consulta y el bloqueo
        const raffle = await this.lockRaffle(tx, raffleId, tenantId);
        if (!raffle || !TICKET_REVOCABLE_STATUSES.includes(raffle.status)) continue;

        revoked.push(...(await this.deleteOrderTickets(tx, tenantId, raffleId, orderId)));
        if (raffle.spendingThreshold !== null) {
          revoked.push(
            ...(await this.revertOrderSpending(tx, tenantId, raffleId, orderId, raffle.spendingThreshold)),
          );
        }
      }
      return revoked;
    });
  }

  /** Tickets PRODUCT_MATCH ligados al pedido. */
  private async deleteOrderTickets(
    tx: Prisma.TransactionClient,
    tenantId: string,
    raffleId: string,
    orderId: string,
  ): Promise<RevokedTicket[]> {
    const tickets = await tx.raffleTicket.findMany({
      where: { tenantId, raffleId, orderId },
      select: { id: true, ticketNumber: true, printedAt: true },
    });
    if (!tickets.length) return [];

    await tx.raffleTicket.deleteMany({ where: { id: { in: tickets.map((t) => t.id) } } });
    return tickets.map((t) => ({ raffleId, ticketNumber: t.ticketNumber, printed: t.printedAt !== null }));
  }

  /**
   * Resta el aporte exacto del pedido y retira los tickets que el gasto restante ya no cubre.
   * Sin aporte registrado (pedido de cortesía, previo al sorteo, ya revertido) no toca nada.
   */
  private async revertOrderSpending(
    tx: Prisma.TransactionClient,
    tenantId: string,
    raffleId: string,
    orderId: string,
    threshold: number,
  ): Promise<RevokedTicket[]> {
    const entry = await tx.raffleOrderSpending.findUnique({
      where: { raffleId_orderId: { raffleId, orderId } },
    });
    if (!entry) return [];

    await tx.raffleOrderSpending.delete({ where: { id: entry.id } });
    const spending = await tx.customerRaffleSpending.update({
      where: { raffleId_customerId: { raffleId, customerId: entry.customerId } },
      data: { totalSpent: { decrement: entry.amount } },
    });

    // Primero los que aún no se imprimieron; entre ellos, los más recientes.
    const tickets = await tx.raffleTicket.findMany({
      where: { tenantId, raffleId, customerId: entry.customerId },
      orderBy: [{ printedAt: { sort: 'asc', nulls: 'first' } }, { ticketNumber: 'desc' }],
      select: { id: true, ticketNumber: true, printedAt: true },
    });
    const covered = ticketsEarned(Number(spending.totalSpent), threshold);
    const excess = tickets.slice(0, Math.max(0, tickets.length - covered));
    if (!excess.length) return [];

    await tx.raffleTicket.deleteMany({ where: { id: { in: excess.map((t) => t.id) } } });
    return excess.map((t) => ({ raffleId, ticketNumber: t.ticketNumber, printed: t.printedAt !== null }));
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private rowToRaffleDto(row: RaffleWithRelations | RaffleWithTickets): RaffleDto {
    const numberOfWinners = row.numberOfWinners ?? 1;
    const allWinners = row.winners ?? [];
    const activeWinners = allWinners.filter((w) => !w.voided);
    const nextPosition = row.status !== 'DRAWN'
      ? nextPositionToDraw(numberOfWinners, activeWinners.map((w) => w.position))
      : null;

    const winners: RaffleWinnerDto[] = allWinners.map((w) => ({
      id: w.id,
      position: w.position,
      prizeDescription: w.prizeDescription ?? null,
      customerId: w.customerId,
      customer: { id: w.customer.id, name: w.customer.name, phone: w.customer.phone },
      ticketId: w.ticketId,
      ticketNumber: w.ticket!.ticketNumber,
      drawnAt: w.drawnAt.toISOString(),
      voided: w.voided ?? false,
      voidedAt: w.voidedAt ? w.voidedAt.toISOString() : null,
      voidReason: w.voidReason,
    }));

    const ticketCount =
      '_count' in row && row._count?.tickets != null
        ? row._count.tickets
        : ('tickets' in row ? (row as RaffleWithTickets).tickets.length : 0);

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      status: row.status as RaffleStatus,
      numberOfWinners,
      ticketMode: (row.ticketMode ?? 'PRODUCT_MATCH') as RaffleTicketMode,
      spendingThreshold: row.spendingThreshold ?? null,
      productId: row.product?.id ?? null,
      productName: row.product?.name ?? null,
      categories: row.categories.map((c) => ({ id: c.category.id, name: c.category.name })),
      prizes: (row.prizes ?? []).map((p) => ({
        position: p.position,
        prizeDescription: p.prizeDescription,
      })),
      winners,
      nextPositionToDraw: nextPosition,
      ticketCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private raffleToDomain(row: Prisma.RaffleGetPayload<{ include: typeof domainInclude }>): Raffle {
    return Raffle.reconstitute({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description ?? null,
      status: row.status as RaffleStatus,
      numberOfWinners: row.numberOfWinners ?? 1,
      ticketMode: (row.ticketMode ?? 'PRODUCT_MATCH') as RaffleTicketMode,
      spendingThreshold: row.spendingThreshold ?? null,
      productId: row.productId ?? null,
      categoryIds: row.categories.map((c) => c.categoryId),
      prizes: (row.prizes ?? []).map((p): RafflePrize => ({
        position: p.position,
        prizeDescription: p.prizeDescription,
      })),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as RaffleProps);
  }

  async setTicketsPrinted(raffleId: string, ticketIds: string[], tenantId: string, printed: boolean): Promise<void> {
    await this.prisma.raffleTicket.updateMany({
      where: { id: { in: ticketIds }, raffleId, tenantId, printedAt: printed ? null : { not: null } },
      data:  { printedAt: printed ? new Date() : null },
    });
  }

  async updateRaffle(
    id: string,
    tenantId: string,
    data: { name?: string; description?: string | null; prizes?: Array<{ position: number; prizeDescription: string }> },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (data.name !== undefined || data.description !== undefined) {
        await tx.raffle.update({
          where: { id, tenantId },
          data: {
            ...(data.name !== undefined      && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
          },
        });
      }
      if (data.prizes?.length) {
        await Promise.all(
          data.prizes.map((p) =>
            tx.rafflePrize.update({
              where: { raffleId_position: { raffleId: id, position: p.position } },
              data: { prizeDescription: p.prizeDescription },
            }),
          ),
        );
      }
    });
  }
}
