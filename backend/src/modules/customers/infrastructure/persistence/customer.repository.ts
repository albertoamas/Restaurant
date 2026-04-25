import { Injectable } from '@nestjs/common';
import { Prisma, Customer as PrismaCustomer } from '@prisma/client';
import { CustomerSearchResult, CustomerStatsDto } from '@pos/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { Customer, CustomerProps } from '../../domain/entities/customer.entity';
import { CustomerRepositoryPort } from '../../domain/ports/customer-repository.port';

interface CustomerStatsRow {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  purchaseCount: bigint | number;
  totalSpent: bigint | number | string;
  lastOrderAt: Date | string | null;
}

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
        notes: customer.notes,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
      update: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        updatedAt: customer.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findByPhone(phone: string, tenantId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({ where: { phone, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(tenantId: string, q?: string, page = 1, limit = 50, sortBy?: 'name' | 'totalSpent' | 'purchaseCount', sortDir?: 'asc' | 'desc'): Promise<{ data: CustomerStatsDto[]; total: number }> {
    const offset = (page - 1) * limit;

    const searchFilter = q
      ? Prisma.sql`AND (c.name ILIKE ${'%' + q + '%'} OR c.phone ILIKE ${'%' + q + '%'})`
      : Prisma.empty;

    const orderByMap: Record<string, Record<string, Prisma.Sql>> = {
      name:          { asc: Prisma.sql`ORDER BY c.name ASC`,          desc: Prisma.sql`ORDER BY c.name DESC` },
      totalSpent:    { asc: Prisma.sql`ORDER BY "totalSpent" ASC`,    desc: Prisma.sql`ORDER BY "totalSpent" DESC` },
      purchaseCount: { asc: Prisma.sql`ORDER BY "purchaseCount" ASC`, desc: Prisma.sql`ORDER BY "purchaseCount" DESC` },
    };
    const orderBy = orderByMap[sortBy ?? 'name']?.[sortDir ?? 'asc'] ?? Prisma.sql`ORDER BY c.name ASC`;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<CustomerStatsRow[]>(Prisma.sql`
        SELECT
          c.id, c.tenant_id AS "tenantId", c.name, c.phone, c.email,
          c.notes, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
          COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')) AS "purchaseCount",
          COALESCE(SUM(o.total) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')), 0) AS "totalSpent",
          MAX(o.created_at) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')) AS "lastOrderAt"
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        WHERE c.tenant_id = ${tenantId}
        ${searchFilter}
        GROUP BY c.id
        ${orderBy}
        LIMIT ${limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM customers c
        WHERE c.tenant_id = ${tenantId}
        ${searchFilter}
      `),
    ]);

    return { data: rows.map(this.toStatsDto), total: Number(countRows[0].count) };
  }

  async findOneWithStats(id: string, tenantId: string): Promise<CustomerStatsDto | null> {
    const rows = await this.prisma.$queryRaw<CustomerStatsRow[]>`
      SELECT
        c.id, c.tenant_id AS "tenantId", c.name, c.phone, c.email,
        c.notes, c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')) AS "purchaseCount",
        COALESCE(SUM(o.total) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')), 0) AS "totalSpent",
        MAX(o.created_at) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')) AS "lastOrderAt"
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.id = ${id} AND c.tenant_id = ${tenantId}
      GROUP BY c.id
    `;
    return rows.length > 0 ? this.toStatsDto(rows[0]) : null;
  }

  async search(q: string, tenantId: string): Promise<CustomerSearchResult[]> {
    const rows = await this.prisma.$queryRaw<{ id: string; name: string; phone: string | null; purchaseCount: bigint }[]>`
      SELECT
        c.id, c.name, c.phone,
        COUNT(o.id) FILTER (WHERE o.status != 'CANCELLED' AND EXISTS (SELECT 1 FROM order_payments op WHERE op.order_id = o.id AND op.method != 'CORTESIA')) AS "purchaseCount"
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

  private toDomain(row: PrismaCustomer): Customer {
    return Customer.reconstitute({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      phone: row.phone ?? null,
      email: row.email ?? null,
      notes: row.notes ?? null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    } as CustomerProps);
  }

  private toStatsDto(r: CustomerStatsRow): CustomerStatsDto {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone ?? null,
      email: r.email ?? null,
      notes: r.notes ?? null,
      createdAt: new Date(r.createdAt).toISOString(),
      purchaseCount: Number(r.purchaseCount ?? 0),
      totalSpent: Number(r.totalSpent ?? 0),
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
    };
  }
}
