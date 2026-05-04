import { randomUUID } from 'crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { RaffleDetailDto, RaffleDto, RaffleSpendingDto, RaffleTicketMode, RaffleWinnerDto } from '@pos/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Raffle, RafflePrize, RaffleProps, RaffleStatus } from '../../domain/entities/raffle.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';
import { NewTicketInput, RaffleRepositoryPort, SpendingResult } from '../../domain/ports/raffle-repository.port';

type RaffleWithRelations = Prisma.RaffleGetPayload<{
  include: {
    product: { select: { id: true; name: true } };
    prizes: { orderBy: { position: 'asc' } };
    winners: {
      include: { customer: { select: { id: true; name: true; phone: true } }; ticket: { select: { ticketNumber: true } } };
      orderBy: { position: 'asc' };
    };
    _count: { select: { tickets: true } };
  };
}>;

type RaffleWithTickets = Prisma.RaffleGetPayload<{
  include: {
    product: { select: { id: true; name: true } };
    prizes: { orderBy: { position: 'asc' } };
    winners: {
      include: {
        customer: { select: { id: true; name: true; phone: true } };
        ticket: { select: { ticketNumber: true } };
      };
      orderBy: { position: 'asc' };
    };
    tickets: {
      include: { customer: { select: { id: true; name: true; phone: true } } };
      orderBy: { ticketNumber: 'asc' };
    };
    customerSpendings: {
      include: { customer: { select: { id: true; name: true; phone: true } } };
      orderBy: { totalSpent: 'desc' };
    };
    _count: { select: { tickets: true } };
  };
}>;

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
    ]);
  }

  async saveRaffle(raffle: Raffle): Promise<void> {
    await this.prisma.raffle.update({
      where: { id: raffle.id },
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
      include: { prizes: { orderBy: { position: 'asc' } } },
    });
    return row ? this.raffleToDomain(row) : null;
  }

  async findAllRaffles(tenantId: string): Promise<RaffleDto[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId },
      include: {
        product: { select: { id: true, name: true } },
        prizes: { orderBy: { position: 'asc' } },
        winners: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            ticket: { select: { ticketNumber: true } },
          },
          orderBy: { position: 'asc' },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => this.rowToRaffleDto(r));
  }

  async findRaffleWithTickets(id: string, tenantId: string): Promise<RaffleDetailDto | null> {
    const row = await this.prisma.raffle.findFirst({
      where: { id, tenantId },
      include: {
        product: { select: { id: true, name: true } },
        prizes: { orderBy: { position: 'asc' } },
        winners: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            ticket: { select: { ticketNumber: true } },
          },
          orderBy: { position: 'asc' },
        },
        tickets: {
          include: { customer: { select: { id: true, name: true, phone: true } } },
          orderBy: { ticketNumber: 'asc' },
        },
        customerSpendings: {
          include: { customer: { select: { id: true, name: true, phone: true } } },
          orderBy: { totalSpent: 'desc' },
        },
        _count: { select: { tickets: true } },
      },
    });
    if (!row) return null;

    const threshold = row.spendingThreshold ?? 1;
    const spendings: RaffleSpendingDto[] = row.customerSpendings.map((s) => ({
      customerId: s.customerId,
      customer: { id: s.customer.id, name: s.customer.name, phone: s.customer.phone },
      totalSpent: Number(s.totalSpent),
      ticketsEarned: Math.floor(Number(s.totalSpent) / threshold),
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
        delivered: t.delivered,
        deliveredAt: t.deliveredAt ? t.deliveredAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      })),
      spendings,
    };
  }

  async findActiveRafflesForProducts(tenantId: string, productIds: string[]): Promise<Raffle[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId, status: 'ACTIVE', ticketMode: 'PRODUCT_MATCH', productId: { in: productIds } },
      include: { prizes: { orderBy: { position: 'asc' } } },
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

  async findActiveSpendingRaffles(tenantId: string): Promise<Raffle[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId, status: 'ACTIVE', ticketMode: 'SPENDING_THRESHOLD' },
      include: { prizes: { orderBy: { position: 'asc' } } },
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

  async findRevertibleSpendingRaffles(tenantId: string): Promise<Raffle[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId, status: { in: ['ACTIVE', 'CLOSED'] }, ticketMode: 'SPENDING_THRESHOLD' },
      include: { prizes: { orderBy: { position: 'asc' } } },
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

  // ─── Tickets ───────────────────────────────────────────────────────────────

  /**
   * Inserta los tickets asignando números secuenciales de forma atómica.
   * SELECT FOR UPDATE sobre la fila del sorteo serializa inserciones concurrentes
   * para el mismo sorteo, evitando colisiones en UNIQUE(raffleId, ticketNumber).
   */
  async addTickets(raffleId: string, inputs: NewTicketInput[]): Promise<void> {
    if (!inputs.length) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM raffles WHERE id = ${raffleId} FOR UPDATE`;

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
    });
  }

  async deleteTicketsByOrderId(tenantId: string, orderId: string): Promise<void> {
    const tickets = await this.prisma.raffleTicket.findMany({
      where: { tenantId, orderId },
      include: { raffle: { select: { status: true } } },
    });

    const eligible = tickets.filter(
      (t) => t.raffle.status !== 'DRAWING' && t.raffle.status !== 'DRAWN',
    );
    if (!eligible.length) return;

    await this.prisma.raffleTicket.deleteMany({
      where: { id: { in: eligible.map((t) => t.id) } },
    });
  }

  // ─── Winners ───────────────────────────────────────────────────────────────

  async addWinner(winner: RaffleWinner): Promise<RaffleWinner> {
    await this.prisma.raffleWinner.create({
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
    return winner;
  }

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
      }),
    );
  }

  async voidWinner(winnerId: string, raffleId: string, tenantId: string): Promise<void> {
    await this.prisma.raffleWinner.updateMany({
      where: { id: winnerId, raffleId, tenantId },
      data: { voided: true },
    });
  }

  async drawWinnerAtomic(id: string, tenantId: string, winner: RaffleWinner, newStatus: RaffleStatus): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Advisory lock por raffle — serializa sorteos concurrentes del mismo sorteo
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`draw-${id}`}))`;

      // Re-verificar estado dentro de la transacción (después de adquirir el lock)
      const current = await tx.raffle.findFirst({
        where: { id, tenantId },
        select: { status: true },
      });
      if (!current || (current.status !== 'ACTIVE' && current.status !== 'CLOSED' && current.status !== 'DRAWING')) {
        throw new ConflictException('El sorteo ya fue completado o está en estado inválido');
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

      await tx.raffle.update({
        where: { id },
        data: { status: newStatus, updatedAt: new Date() },
      });
    });
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async deleteRaffle(id: string, tenantId: string): Promise<void> {
    await this.prisma.raffle.deleteMany({ where: { id, tenantId } });
  }

  // ─── Spending threshold ────────────────────────────────────────────────────

  async addCustomerSpending(
    tenantId: string,
    raffleId: string,
    customerId: string,
    amount: number,
  ): Promise<SpendingResult> {
    const result = await this.prisma.customerRaffleSpending.upsert({
      where: { raffleId_customerId: { raffleId, customerId } },
      create: { id: randomUUID(), tenantId, raffleId, customerId, totalSpent: amount },
      update: { totalSpent: { increment: amount } },
    });
    return { newTotal: Number(result.totalSpent) };
  }

  async subtractCustomerSpending(
    tenantId: string,
    raffleId: string,
    customerId: string,
    amount: number,
  ): Promise<SpendingResult> {
    return this.prisma.$transaction(async (tx) => {
      // SELECT FOR UPDATE serializa escrituras concurrentes sobre la misma fila.
      await tx.$executeRaw`
        SELECT id FROM customer_raffle_spending
        WHERE raffle_id = ${raffleId} AND customer_id = ${customerId} AND tenant_id = ${tenantId}
        FOR UPDATE
      `;
      const record = await tx.customerRaffleSpending.findUnique({
        where: { raffleId_customerId: { raffleId, customerId } },
      });
      if (!record) return { newTotal: 0 };

      const newTotal = Math.max(0, Number(record.totalSpent) - amount);
      await tx.customerRaffleSpending.update({
        where: { raffleId_customerId: { raffleId, customerId } },
        data: { totalSpent: newTotal },
      });
      return { newTotal };
    });
  }

  async countTicketsByCustomer(tenantId: string, raffleId: string, customerId: string): Promise<number> {
    return this.prisma.raffleTicket.count({ where: { tenantId, raffleId, customerId } });
  }

  async deleteExcessTicketsByCustomer(
    tenantId: string,
    raffleId: string,
    customerId: string,
    excessCount: number,
  ): Promise<void> {
    const raffle = await this.prisma.raffle.findUnique({
      where: { id: raffleId },
      select: { status: true },
    });
    if (!raffle || raffle.status === 'DRAWING' || raffle.status === 'DRAWN') return;

    const toDelete = await this.prisma.raffleTicket.findMany({
      where: { tenantId, raffleId, customerId },
      orderBy: { createdAt: 'desc' },
      take: excessCount,
      select: { id: true },
    });
    if (!toDelete.length) return;

    await this.prisma.raffleTicket.deleteMany({
      where: { id: { in: toDelete.map((t) => t.id) } },
    });
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private rowToRaffleDto(row: RaffleWithRelations | RaffleWithTickets): RaffleDto {
    const numberOfWinners = row.numberOfWinners ?? 1;
    const allWinners = row.winners ?? [];
    const activeWinners = allWinners.filter((w) => !w.voided);
    const activePositions = new Set(activeWinners.map((w) => w.position));

    let nextPosition: number | null = null;
    if (row.status !== 'DRAWN') {
      const allPositions = Array.from({ length: numberOfWinners }, (_, i) => i + 1);
      const missing = allPositions.filter((p) => !activePositions.has(p));
      nextPosition = missing.length > 0 ? Math.max(...missing) : null;
    }

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

  private raffleToDomain(row: Prisma.RaffleGetPayload<{ include: { prizes: true } }>): Raffle {
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
      prizes: (row.prizes ?? []).map((p): RafflePrize => ({
        position: p.position,
        prizeDescription: p.prizeDescription,
      })),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as RaffleProps);
  }

  async deliverTickets(raffleId: string, ticketIds: string[], tenantId: string): Promise<void> {
    await this.prisma.raffleTicket.updateMany({
      where: { id: { in: ticketIds }, raffleId, tenantId, delivered: false },
      data:  { delivered: true, deliveredAt: new Date() },
    });
  }
}
