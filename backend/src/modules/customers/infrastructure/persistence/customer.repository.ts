import { Injectable } from '@nestjs/common';
import { CustomerSearchResult, CustomerStatsDto } from '@pos/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { Customer, CustomerProps } from '../../domain/entities/customer.entity';
import { CustomerRepositoryPort } from '../../domain/ports/customer-repository.port';

@Injectable()
export class CustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(customer: Customer): Promise<Customer> {
    const row = await this.prisma.customer.upsert({
      where: { id: customer.id },
      create: {
        id: customer.id,
        tenantId: customer.tenantId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isRaffleWinner: customer.isRaffleWinner,
        notes: customer.notes,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      update: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        isRaffleWinner: customer.isRaffleWinner,
        notes: customer.notes,
        updatedAt: customer.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByPhone(phone: string, tenantId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({
      where: { phone, tenantId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(tenantId: string, q?: string, page = 1, limit = 50): Promise<CustomerStatsDto[]> {
    const offset = (page - 1) * limit;
    const searchClause = q
      ? `AND (c.name ILIKE $2 OR c.phone ILIKE $2)`
      : '';

    const params: unknown[] = q
      ? [tenantId, `%${q}%`, limit, offset]
      : [tenantId, limit, offset];

    const limitIdx = q ? 3 : 2;
    const offsetIdx = q ? 4 : 3;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT
        c.id, c.tenant_id AS "tenantId", c.name, c.phone, c.email,
        c.is_raffle_winner AS "isRaffleWinner", c.notes,
        c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED') AS "purchaseCount",
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'CANCELLED'), 0) AS "totalSpent",
        MAX(o.created_at) FILTER (WHERE o.status != 'CANCELLED') AS "lastOrderAt"
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.tenant_id = $1
      ${searchClause}
      GROUP BY c.id
      ORDER BY c.name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      ...params,
    );

    return rows.map(this.toStatsDto);
  }

  async findOneWithStats(id: string, tenantId: string): Promise<CustomerStatsDto | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        c.id, c.tenant_id AS "tenantId", c.name, c.phone, c.email,
        c.is_raffle_winner AS "isRaffleWinner", c.notes,
        c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED') AS "purchaseCount",
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'CANCELLED'), 0) AS "totalSpent",
        MAX(o.created_at) FILTER (WHERE o.status != 'CANCELLED') AS "lastOrderAt"
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.id = ${id} AND c.tenant_id = ${tenantId}
      GROUP BY c.id
    `;
    return rows.length > 0 ? this.toStatsDto(rows[0]) : null;
  }

  async search(q: string, tenantId: string): Promise<CustomerSearchResult[]> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT
        c.id, c.name, c.phone,
        COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED') AS "purchaseCount"
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.tenant_id = ${tenantId}
        AND (c.name ILIKE ${'%' + q + '%'} OR c.phone ILIKE ${'%' + q + '%'})
      GROUP BY c.id
      ORDER BY "purchaseCount" DESC
      LIMIT 10
    `;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone ?? null,
      purchaseCount: Number(r.purchaseCount ?? 0),
    }));
  }

  private toDomain(row: any): Customer {
    return Customer.reconstitute({
      id: row.id,
      tenantId: row.tenantId ?? row.tenant_id,
      name: row.name,
      phone: row.phone ?? null,
      email: row.email ?? null,
      isRaffleWinner: row.isRaffleWinner ?? row.is_raffle_winner ?? false,
      notes: row.notes ?? null,
      createdAt: new Date(row.createdAt ?? row.created_at),
      updatedAt: new Date(row.updatedAt ?? row.updated_at),
    } as CustomerProps);
  }

  private toStatsDto(r: any): CustomerStatsDto {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone ?? null,
      email: r.email ?? null,
      isRaffleWinner: r.isRaffleWinner ?? false,
      notes: r.notes ?? null,
      createdAt: new Date(r.createdAt).toISOString(),
      purchaseCount: Number(r.purchaseCount ?? 0),
      totalSpent: Number(r.totalSpent ?? 0),
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
    };
  }
}
