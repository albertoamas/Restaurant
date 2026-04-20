import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { RaffleDto, RaffleTicketDto, RaffleWinnerDto } from '@pos/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { Raffle, RafflePrize, RaffleProps, RaffleStatus } from '../../domain/entities/raffle.entity';
import { RaffleTicket, RaffleTicketProps } from '../../domain/entities/raffle-ticket.entity';
import { RaffleWinner } from '../../domain/entities/raffle-winner.entity';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class RaffleRepository implements RaffleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Raffle ────────────────────────────────────────────────────────────────

  async saveRaffle(raffle: Raffle): Promise<Raffle> {
    await this.prisma.$transaction(async (tx) => {
      await tx.raffle.upsert({
        where: { id: raffle.id },
        create: {
          id: raffle.id,
          tenantId: raffle.tenantId,
          name: raffle.name,
          description: raffle.description,
          status: raffle.status,
          numberOfWinners: raffle.numberOfWinners,
          productId: raffle.productId,
          createdAt: raffle.createdAt,
          updatedAt: raffle.updatedAt,
        },
        update: {
          name: raffle.name,
          description: raffle.description,
          status: raffle.status,
          numberOfWinners: raffle.numberOfWinners,
          productId: raffle.productId,
          updatedAt: raffle.updatedAt,
        },
      });

      // Si el sorteo viene con premios definidos, sincronizamos raffle_prizes.
      // Esto solo ocurre al crear (prizes.length > 0). En updates de estado, prizes = [].
      if (raffle.prizes.length > 0) {
        await tx.rafflePrize.deleteMany({ where: { raffleId: raffle.id } });
        await tx.rafflePrize.createMany({
          data: raffle.prizes.map((p) => ({
            id: randomUUID(),
            raffleId: raffle.id,
            position: p.position,
            prizeDescription: p.prizeDescription,
          })),
        });
      }
    });

    return raffle;
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
          include: { customer: { select: { id: true, name: true, phone: true } } },
          orderBy: { position: 'asc' },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => this.rowToRaffleDto(r));
  }

  async findRaffleWithTickets(
    id: string,
    tenantId: string,
  ): Promise<(RaffleDto & { tickets: RaffleTicketDto[] }) | null> {
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
        _count: { select: { tickets: true } },
      },
    });
    if (!row) return null;

    return {
      ...this.rowToRaffleDto(row),
      tickets: row.tickets.map((t) => ({
        id: t.id,
        raffleId: t.raffleId,
        customerId: t.customerId,
        customer: { id: t.customer.id, name: t.customer.name, phone: t.customer.phone },
        ticketNumber: t.ticketNumber,
        orderId: t.orderId,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async findActiveRafflesForProducts(tenantId: string, productIds: string[]): Promise<Raffle[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId, status: 'ACTIVE', productId: { in: productIds } },
      include: { prizes: { orderBy: { position: 'asc' } } },
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

  // ─── Tickets ───────────────────────────────────────────────────────────────

  async getNextTicketNumber(raffleId: string): Promise<number> {
    const result = await this.prisma.raffleTicket.aggregate({
      where: { raffleId },
      _max: { ticketNumber: true },
    });
    return (result._max.ticketNumber ?? 0) + 1;
  }

  async addTickets(tickets: RaffleTicket[]): Promise<RaffleTicket[]> {
    const rows = await Promise.all(
      tickets.map((t) =>
        this.prisma.raffleTicket.create({
          data: {
            id: t.id,
            tenantId: t.tenantId,
            raffleId: t.raffleId,
            customerId: t.customerId,
            ticketNumber: t.ticketNumber,
            orderId: t.orderId,
            createdAt: t.createdAt,
          },
        }),
      ),
    );
    return rows.map(this.ticketToDomain);
  }

  async deleteTicketsByOrderId(tenantId: string, orderId: string): Promise<void> {
    const tickets = await this.prisma.raffleTicket.findMany({
      where: { tenantId, orderId },
      include: { raffle: { select: { status: true } } },
    });

    // No eliminamos tickets de sorteos que ya están en sorteo o terminados.
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

  async findWinnersByRaffleId(raffleId: string): Promise<RaffleWinner[]> {
    const rows = await this.prisma.raffleWinner.findMany({
      where: { raffleId },
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

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async deleteRaffle(id: string, tenantId: string): Promise<void> {
    await this.prisma.raffle.deleteMany({ where: { id, tenantId } });
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private rowToRaffleDto(row: any): RaffleDto {
    const numberOfWinners = row.numberOfWinners ?? 1;
    const allWinners: any[] = row.winners ?? [];
    const activeWinners = allWinners.filter((w: any) => !w.voided);
    const activePositions = new Set(activeWinners.map((w: any) => w.position));

    let nextPosition: number | null = null;
    if (row.status !== 'DRAWN') {
      const allPositions = Array.from({ length: numberOfWinners }, (_, i) => i + 1);
      const missing = allPositions.filter((p) => !activePositions.has(p));
      nextPosition = missing.length > 0 ? Math.max(...missing) : null;
    }

    const winners: RaffleWinnerDto[] = allWinners.map((w: any) => ({
      id: w.id,
      position: w.position,
      prizeDescription: w.prizeDescription ?? null,
      customerId: w.customerId,
      customer: { id: w.customer.id, name: w.customer.name, phone: w.customer.phone },
      ticketId: w.ticketId,
      ticketNumber: w.ticket?.ticketNumber ?? 0,
      drawnAt: w.drawnAt.toISOString(),
      voided: w.voided ?? false,
    }));

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      status: row.status as RaffleStatus,
      numberOfWinners,
      productId: row.product?.id ?? null,
      productName: row.product?.name ?? null,
      prizes: (row.prizes ?? []).map((p: any) => ({
        position: p.position,
        prizeDescription: p.prizeDescription,
      })),
      winners,
      nextPositionToDraw: nextPosition,
      ticketCount: row._count?.tickets ?? row.tickets?.length ?? 0,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private raffleToDomain(row: any): Raffle {
    return Raffle.reconstitute({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description ?? null,
      status: row.status as RaffleStatus,
      numberOfWinners: row.numberOfWinners ?? 1,
      productId: row.productId ?? null,
      prizes: (row.prizes ?? []).map(
        (p: any): RafflePrize => ({
          position: p.position,
          prizeDescription: p.prizeDescription,
        }),
      ),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as RaffleProps);
  }

  private ticketToDomain(row: any): RaffleTicket {
    return RaffleTicket.reconstitute({
      id: row.id,
      tenantId: row.tenantId,
      raffleId: row.raffleId,
      customerId: row.customerId,
      ticketNumber: row.ticketNumber,
      orderId: row.orderId ?? null,
      createdAt: new Date(row.createdAt),
    } as RaffleTicketProps);
  }
}
