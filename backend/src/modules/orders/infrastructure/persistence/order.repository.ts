import { Injectable } from '@nestjs/common';
import { OrderStatus, OrderType, PaymentMethod, TopProductDto } from '@pos/shared';
import { BOLIVIA_OFFSET } from '../../../../common/utils/timezone.util';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderPayment } from '../../domain/entities/order-payment.entity';
import {
  DailyReportResult,
  OrderFilters,
  OrderRepositoryPort,
} from '../../domain/ports/order-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; customer: true; payments: true };
}>;

function toDomain(row: OrderWithRelations): Order {
  const items = row.items.map((item) =>
    OrderItem.reconstitute({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    }),
  );

  const payments = row.payments.map(
    (p) =>
      new OrderPayment({
        id:       p.id,
        orderId:  p.orderId,
        tenantId: p.tenantId,
        method:   p.method as PaymentMethod,
        amount:   Number(p.amount),
      }),
  );

  return Order.reconstitute({
    id:            row.id,
    tenantId:      row.tenantId,
    branchId:      row.branchId,
    orderNumber:   row.orderNumber,
    type:          row.type as OrderType,
    status:        row.status as OrderStatus,
    paymentMethod: (row.paymentMethod as PaymentMethod) ?? null,
    payments,
    items,
    subtotal:   Number(row.subtotal),
    total:      Number(row.total),
    notes:      row.notes,
    createdBy:  row.createdBy,
    customerId: row.customerId ?? null,
    customer:   row.customer
      ? { id: row.customer.id, name: row.customer.name, phone: row.customer.phone ?? null }
      : null,
    createdAt:  row.createdAt,
    updatedAt:  row.updatedAt,
  });
}

const INCLUDE_ALL = { items: true, customer: true, payments: true } as const;

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(order: Order): Promise<Order> {
    const row = await this.prisma.order.upsert({
      where:  { id: order.id },
      create: {
        id:            order.id,
        tenantId:      order.tenantId,
        branchId:      order.branchId,
        orderNumber:   order.orderNumber,
        type:          order.type,
        status:        order.status,
        paymentMethod: order.paymentMethod,
        subtotal:      order.subtotal,
        total:         order.total,
        notes:         order.notes,
        createdBy:     order.createdBy,
        customerId:    order.customerId ?? null,
        createdAt:     order.createdAt,
        updatedAt:     order.updatedAt,
        items: {
          create: order.items.map((item) => ({
            id:          item.id,
            productId:   item.productId,
            productName: item.productName,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            subtotal:    item.subtotal,
          })),
        },
        payments: {
          create: order.payments.map((p) => ({
            id:       p.id,
            tenantId: p.tenantId,
            method:   p.method,
            amount:   p.amount,
          })),
        },
      },
      update: {
        status:    order.status,
        updatedAt: order.updatedAt,
      },
      include: INCLUDE_ALL,
    });
    return toDomain(row);
  }

  async registerPayments(
    orderId: string,
    tenantId: string,
    payments: { id: string; method: PaymentMethod; amount: number }[],
    dominantMethod: PaymentMethod,
  ): Promise<Order> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.orderPayment.createMany({
        data: payments.map((p) => ({
          id:       p.id,
          orderId,
          tenantId,
          method:   p.method,
          amount:   p.amount,
        })),
      });
      await tx.order.update({
        where: { id: orderId },
        data:  { paymentMethod: dominantMethod, updatedAt: new Date() },
      });
      return tx.order.findFirstOrThrow({
        where:   { id: orderId },
        include: INCLUDE_ALL,
      });
    });
    return toDomain(row);
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const row = await this.prisma.order.findFirst({
      where:   { id, tenantId },
      include: INCLUDE_ALL,
    });
    return row ? toDomain(row) : null;
  }

  async findAll(tenantId: string, filters: OrderFilters = {}): Promise<{ data: Order[]; total: number }> {
    const { date, status, branchId } = filters;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip  = ((filters.page ?? 1) - 1) * limit;

    const where: Prisma.OrderWhereInput = { tenantId };

    if (branchId)            where.branchId   = branchId;
    if (status)              where.status      = status;
    if (filters.customerId)  where.customerId  = filters.customerId;
    if (filters.from && filters.to) {
      where.createdAt = { gte: new Date(filters.from), lte: new Date(filters.to) };
    } else if (date) {
      // Límites en hora Bolivia: medianoche local → UTC+4h
      const start = new Date(`${date}T00:00:00${BOLIVIA_OFFSET}`);
      const end   = new Date(`${date}T23:59:59.999${BOLIVIA_OFFSET}`);
      where.createdAt = { gte: start, lte: end };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: INCLUDE_ALL,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: rows.map(toDomain), total };
  }

  async getNextOrderNumber(tenantId: string, branchId: string, boliviaDateStr: string, resetPeriod = 'DAILY'): Promise<number> {
    // Normalizar el periodo según el modo de reset:
    //   DAILY   → 'YYYY-MM-DD'  (boliviaDateStr ya viene en este formato)
    //   MONTHLY → 'YYYY-MM'     (truncar los últimos 3 caracteres)
    const period =
      resetPeriod === 'MONTHLY'
        ? boliviaDateStr.slice(0, 7)  // 'YYYY-MM'
        : boliviaDateStr;             // 'YYYY-MM-DD'

    // INSERT atómico: si el periodo no existe → last_number = 1 (primer pedido del día/mes)
    //                  si ya existe           → incrementa last_number en 1
    // El RETURNING devuelve el valor DESPUÉS del update, en un único round-trip.
    // Esto es seguro bajo concurrencia total: PostgreSQL serializa el UPDATE dentro
    // del ON CONFLICT, imposibilitando que dos requests lean el mismo valor.
    const result = await this.prisma.$queryRaw<[{ last_number: number }]>`
      INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
      VALUES (${tenantId}, ${branchId}, ${period}, 1)
      ON CONFLICT (tenant_id, branch_id, period)
      DO UPDATE SET last_number = branch_order_sequences.last_number + 1
      RETURNING last_number`;

    return result[0].last_number;
  }

  async getDailyReport(tenantId: string, date: string, branchId?: string | null): Promise<DailyReportResult> {
    const branchFilter = branchId
      ? Prisma.sql`AND o.branch_id = ${branchId}`
      : Prisma.sql``;

    const result = await this.prisma.$queryRaw<[Record<string, unknown>]>`
      WITH filtered_orders AS (
        SELECT o.id, o.total, o.type
        FROM orders o
        WHERE o.tenant_id = ${tenantId}
          ${branchFilter}
          AND DATE(o.created_at AT TIME ZONE 'America/La_Paz') = ${date}::date
          AND o.status != ${OrderStatus.CANCELLED}
          AND EXISTS (SELECT 1 FROM order_payments op2 WHERE op2.order_id = o.id)
      ),
      order_stats AS (
        SELECT
          COALESCE(SUM(total), 0)                                                   AS "totalSales",
          COUNT(*)                                                                   AS "orderCount",
          COALESCE(AVG(total), 0)                                                   AS "averageTicket",
          COALESCE(SUM(CASE WHEN type = ${OrderType.DINE_IN}  THEN 1 ELSE 0 END), 0) AS "dineInCount",
          COALESCE(SUM(CASE WHEN type = ${OrderType.TAKEOUT}  THEN 1 ELSE 0 END), 0) AS "takeoutCount",
          COALESCE(SUM(CASE WHEN type = ${OrderType.DELIVERY} THEN 1 ELSE 0 END), 0) AS "deliveryCount"
        FROM filtered_orders
      ),
      payment_stats AS (
        SELECT
          COALESCE(SUM(CASE WHEN op.method = ${PaymentMethod.CASH}     THEN op.amount ELSE 0 END), 0) AS "cashSales",
          COALESCE(SUM(CASE WHEN op.method = ${PaymentMethod.QR}       THEN op.amount ELSE 0 END), 0) AS "qrSales",
          COALESCE(SUM(CASE WHEN op.method = ${PaymentMethod.TRANSFER} THEN op.amount ELSE 0 END), 0) AS "transferSales"
        FROM order_payments op
        WHERE op.order_id IN (SELECT id FROM filtered_orders)
      )
      SELECT os.*, ps.*
      FROM order_stats os, payment_stats ps`;

    return this.mapReport(result[0] ?? {});
  }

  async getReportByRange(
    tenantId: string,
    branchId: string | null,
    from: string,
    to: string,
  ): Promise<DailyReportResult> {
    const fromTs = new Date(from);
    const toTs   = new Date(to);

    const branchFilter = branchId
      ? Prisma.sql`AND o.branch_id = ${branchId}`
      : Prisma.sql``;

    const result = await this.prisma.$queryRaw<[Record<string, unknown>]>`
      WITH filtered_orders AS (
        SELECT o.id, o.total, o.type
        FROM orders o
        WHERE o.tenant_id = ${tenantId}
          ${branchFilter}
          AND o.created_at BETWEEN ${fromTs} AND ${toTs}
          AND o.status != ${OrderStatus.CANCELLED}
          AND EXISTS (SELECT 1 FROM order_payments op2 WHERE op2.order_id = o.id)
      ),
      order_stats AS (
        SELECT
          COALESCE(SUM(total), 0)                                                   AS "totalSales",
          COUNT(*)                                                                   AS "orderCount",
          COALESCE(AVG(total), 0)                                                   AS "averageTicket",
          COALESCE(SUM(CASE WHEN type = ${OrderType.DINE_IN}  THEN 1 ELSE 0 END), 0) AS "dineInCount",
          COALESCE(SUM(CASE WHEN type = ${OrderType.TAKEOUT}  THEN 1 ELSE 0 END), 0) AS "takeoutCount",
          COALESCE(SUM(CASE WHEN type = ${OrderType.DELIVERY} THEN 1 ELSE 0 END), 0) AS "deliveryCount"
        FROM filtered_orders
      ),
      payment_stats AS (
        SELECT
          COALESCE(SUM(CASE WHEN op.method = ${PaymentMethod.CASH}     THEN op.amount ELSE 0 END), 0) AS "cashSales",
          COALESCE(SUM(CASE WHEN op.method = ${PaymentMethod.QR}       THEN op.amount ELSE 0 END), 0) AS "qrSales",
          COALESCE(SUM(CASE WHEN op.method = ${PaymentMethod.TRANSFER} THEN op.amount ELSE 0 END), 0) AS "transferSales"
        FROM order_payments op
        WHERE op.order_id IN (SELECT id FROM filtered_orders)
      )
      SELECT os.*, ps.*
      FROM order_stats os, payment_stats ps`;

    return this.mapReport(result[0] ?? {});
  }

  async getTopProducts(
    tenantId: string,
    branchId: string | null,
    from: string,
    to: string,
    categoryId?: string,
  ): Promise<TopProductDto[]> {
    const fromTs = new Date(from);
    const toTs   = new Date(to);

    type RawRow = {
      productId: string;
      productName: string;
      categoryId: string | null;
      categoryName: string | null;
      totalQuantity: bigint;
      totalRevenue: unknown;
    };

    let rows: RawRow[];

    if (branchId && categoryId) {
      rows = await this.prisma.$queryRaw<RawRow[]>`
        SELECT oi.product_id AS "productId", oi.product_name AS "productName",
               c.id AS "categoryId", c.name AS "categoryName",
               SUM(oi.quantity)::bigint AS "totalQuantity",
               SUM(oi.subtotal) AS "totalRevenue"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.tenant_id = ${tenantId}
          AND o.branch_id = ${branchId}
          AND o.created_at BETWEEN ${fromTs} AND ${toTs}
          AND o.status != ${OrderStatus.CANCELLED}
          AND c.id = ${categoryId}
        GROUP BY oi.product_id, oi.product_name, c.id, c.name
        ORDER BY "totalQuantity" DESC
        LIMIT 20`;
    } else if (branchId) {
      rows = await this.prisma.$queryRaw<RawRow[]>`
        SELECT oi.product_id AS "productId", oi.product_name AS "productName",
               c.id AS "categoryId", c.name AS "categoryName",
               SUM(oi.quantity)::bigint AS "totalQuantity",
               SUM(oi.subtotal) AS "totalRevenue"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.tenant_id = ${tenantId}
          AND o.branch_id = ${branchId}
          AND o.created_at BETWEEN ${fromTs} AND ${toTs}
          AND o.status != ${OrderStatus.CANCELLED}
        GROUP BY oi.product_id, oi.product_name, c.id, c.name
        ORDER BY "totalQuantity" DESC
        LIMIT 20`;
    } else if (categoryId) {
      rows = await this.prisma.$queryRaw<RawRow[]>`
        SELECT oi.product_id AS "productId", oi.product_name AS "productName",
               c.id AS "categoryId", c.name AS "categoryName",
               SUM(oi.quantity)::bigint AS "totalQuantity",
               SUM(oi.subtotal) AS "totalRevenue"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.tenant_id = ${tenantId}
          AND o.created_at BETWEEN ${fromTs} AND ${toTs}
          AND o.status != ${OrderStatus.CANCELLED}
          AND c.id = ${categoryId}
        GROUP BY oi.product_id, oi.product_name, c.id, c.name
        ORDER BY "totalQuantity" DESC
        LIMIT 20`;
    } else {
      rows = await this.prisma.$queryRaw<RawRow[]>`
        SELECT oi.product_id AS "productId", oi.product_name AS "productName",
               c.id AS "categoryId", c.name AS "categoryName",
               SUM(oi.quantity)::bigint AS "totalQuantity",
               SUM(oi.subtotal) AS "totalRevenue"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.tenant_id = ${tenantId}
          AND o.created_at BETWEEN ${fromTs} AND ${toTs}
          AND o.status != ${OrderStatus.CANCELLED}
        GROUP BY oi.product_id, oi.product_name, c.id, c.name
        ORDER BY "totalQuantity" DESC
        LIMIT 20`;
    }

    return rows.map((r) => ({
      productId:     r.productId,
      productName:   r.productName,
      categoryId:    r.categoryId ?? null,
      categoryName:  r.categoryName ?? null,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue:  Number(r.totalRevenue),
    }));
  }

  private mapReport(row: Record<string, unknown>): DailyReportResult {
    return {
      totalSales:    Number(row.totalSales   ?? 0),
      orderCount:    Number(row.orderCount   ?? 0),
      averageTicket: Number(row.averageTicket ?? 0),
      paymentBreakdown: {
        cash:     Number(row.cashSales     ?? 0),
        qr:       Number(row.qrSales       ?? 0),
        transfer: Number(row.transferSales ?? 0),
      },
      ordersByType: {
        dineIn:   Number(row.dineInCount   ?? 0),
        takeout:  Number(row.takeoutCount  ?? 0),
        delivery: Number(row.deliveryCount ?? 0),
      },
    };
  }
}
