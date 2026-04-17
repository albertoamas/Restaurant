import { Injectable } from '@nestjs/common';
import { RaffleDto, RaffleTicketDto } from '@pos/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { Raffle, RaffleProps, RaffleStatus } from '../../domain/entities/raffle.entity';
import { RaffleTicket, RaffleTicketProps } from '../../domain/entities/raffle-ticket.entity';
import { RaffleRepositoryPort } from '../../domain/ports/raffle-repository.port';

@Injectable()
export class RaffleRepository implements RaffleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async saveRaffle(raffle: Raffle): Promise<Raffle> {
    const row = await this.prisma.raffle.upsert({
      where: { id: raffle.id },
      create: {
        id: raffle.id,
        tenantId: raffle.tenantId,
        name: raffle.name,
        description: raffle.description,
        status: raffle.status,
        prizeDescription: raffle.prizeDescription,
        productId: raffle.productId,
        winnerCustomerId: raffle.winnerCustomerId,
        winnerTicketId: raffle.winnerTicketId,
        drawnAt: raffle.drawnAt,
        createdAt: raffle.createdAt,
        updatedAt: raffle.updatedAt,
      },
      update: {
        name: raffle.name,
        description: raffle.description,
        status: raffle.status,
        prizeDescription: raffle.prizeDescription,
        productId: raffle.productId,
        winnerCustomerId: raffle.winnerCustomerId,
        winnerTicketId: raffle.winnerTicketId,
        drawnAt: raffle.drawnAt,
        updatedAt: raffle.updatedAt,
      },
    });
    return this.raffleToDomain(row);
  }

  async findRaffleById(id: string, tenantId: string): Promise<Raffle | null> {
    const row = await this.prisma.raffle.findFirst({ where: { id, tenantId } });
    return row ? this.raffleToDomain(row) : null;
  }

  async findAllRaffles(tenantId: string): Promise<RaffleDto[]> {
    const rows = await this.prisma.raffle.findMany({
      where: { tenantId },
      include: {
        product: { select: { id: true, name: true } },
        winnerCustomer: { select: { id: true, name: true, phone: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status as RaffleStatus,
      prizeDescription: r.prizeDescription,
      productId: r.product?.id ?? null,
      productName: r.product?.name ?? null,
      winnerCustomerId: r.winnerCustomerId,
      winnerTicketId: r.winnerTicketId ?? null,
      winnerCustomer: r.winnerCustomer
        ? { id: r.winnerCustomer.id, name: r.winnerCustomer.name, phone: r.winnerCustomer.phone }
        : null,
      ticketCount: r._count.tickets,
      drawnAt: r.drawnAt ? r.drawnAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async findRaffleWithTickets(
    id: string,
    tenantId: string,
  ): Promise<(RaffleDto & { tickets: RaffleTicketDto[] }) | null> {
    const row = await this.prisma.raffle.findFirst({
      where: { id, tenantId },
      include: {
        product: { select: { id: true, name: true } },
        winnerCustomer: { select: { id: true, name: true, phone: true } },
        tickets: {
          include: { customer: { select: { id: true, name: true, phone: true } } },
          orderBy: { ticketNumber: 'asc' },
        },
      },
    });
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as RaffleStatus,
      prizeDescription: row.prizeDescription,
      productId: row.product?.id ?? null,
      productName: row.product?.name ?? null,
      winnerCustomerId: row.winnerCustomerId,
      winnerTicketId: row.winnerTicketId ?? null,
      winnerCustomer: row.winnerCustomer
        ? { id: row.winnerCustomer.id, name: row.winnerCustomer.name, phone: row.winnerCustomer.phone }
        : null,
      ticketCount: row.tickets.length,
      drawnAt: row.drawnAt ? row.drawnAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
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
      where: {
        tenantId,
        status: 'ACTIVE',
        productId: { in: productIds },
      },
    });
    return rows.map((r) => this.raffleToDomain(r));
  }

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

  async deleteRaffle(id: string, _tenantId: string): Promise<void> {
    // CASCADE on raffle_tickets.raffle_id auto-deletes all tickets
    await this.prisma.raffle.delete({ where: { id } });
  }

  async deleteTicketsByOrderId(tenantId: string, orderId: string): Promise<void> {
    const tickets = await this.prisma.raffleTicket.findMany({
      where: { tenantId, orderId },
      include: { raffle: { select: { status: true } } },
    });

    const eligible = tickets.filter((t) => t.raffle.status !== 'DRAWN');
    if (!eligible.length) return;

    await this.prisma.raffleTicket.deleteMany({
      where: { id: { in: eligible.map((t) => t.id) } },
    });
  }

  private raffleToDomain(row: any): Raffle {
    return Raffle.reconstitute({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description ?? null,
      status: row.status as RaffleStatus,
      prizeDescription: row.prizeDescription ?? null,
      productId: row.productId ?? null,
      winnerCustomerId: row.winnerCustomerId ?? null,
      winnerTicketId: row.winnerTicketId ?? null,
      drawnAt: row.drawnAt ? new Date(row.drawnAt) : null,
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
