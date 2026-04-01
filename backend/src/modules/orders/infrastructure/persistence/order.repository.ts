import { Injectable } from '@nestjs/common';
import { OrderStatus, OrderType, PaymentMethod, TopProductDto } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import {
  DailyReportResult,
  OrderFilters,
  OrderRepositoryPort,
} from '../../domain/ports/order-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true; customer: true } }>;

function toDomain(row: OrderWithItems): Order {
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

  return Order.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    branchId: row.branchId,
    orderNumber: row.orderNumber,
    type: row.type as OrderType,
    status: row.status as OrderStatus,
    paymentMethod: row.paymentMethod as PaymentMethod,
    items,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    notes: row.notes,
    createdBy: row.createdBy,
    customerId: row.customerId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(order: Order): Promise<Order> {
    const row = await this.prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        tenantId: order.tenantId,
        branchId: order.branchId,
        orderNumber: order.orderNumber,
        type: order.type,
        status: order.status,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        total: order.total,
        notes: order.notes,
        createdBy: order.createdBy,
        customerId: order.customerId ?? null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: {
          create: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      update: {
        status: order.status,
        updatedAt: order.updatedAt,
      },
      include: { items: true, customer: true },
    });
    return toDomain(row);
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const row = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true, customer: true },
    });
    return row ? toDomain(row) : null;
  }

  async findAll(tenantId: string, filters: OrderFilters = {}): Promise<Order[]> {
    const { date, status, branchId } = filters;

    const where: Prisma.OrderWhereInput = { tenantId };

    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.from && filters.to) {
      where.createdAt = { gte: new Date(filters.from), lte: new Date(filters.to) };
    } else if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = { gte: start, lte: end };
    }

    const rows = await this.prisma.order.findMany({
      where,
      include: { items: true, customer: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map(toDomain);
  }

  async getNextOrderNumber(tenantId: string, branchId: string, date: Date): Promise<number> {
    const dateString = date.toISOString().split('T')[0];

    const result = await this.prisma.$queryRaw<[{ next_number: bigint }]>`
      SELECT COALESCE(MAX(order_number), 0) + 1 AS next_number
      FROM orders
      WHERE tenant_id = ${tenantId}
        AND branch_id = ${branchId}
        AND DATE(created_at) = ${dateString}::date`;

    return Number(result[0]?.next_number ?? 1);
  }

  async getDailyReport(tenantId: string, date: string): Promise<DailyReportResult> {
    const result = await this.prisma.$queryRaw<[Record<string, unknown>]>`
      SELECT
        COALESCE(SUM(total), 0)                                                 AS "totalSales",
        COUNT(*)                                                                 AS "orderCount",
        COALESCE(AVG(total), 0)                                                 AS "averageTicket",
        COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.CASH}      THEN total ELSE 0 END), 0) AS "cashSales",
        COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.QR}        THEN total ELSE 0 END), 0) AS "qrSales",
        COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.TRANSFER}  THEN total ELSE 0 END), 0) AS "transferSales",
        COALESCE(SUM(CASE WHEN type = ${OrderType.DINE_IN}  THEN 1 ELSE 0 END), 0) AS "dineInCount",
        COALESCE(SUM(CASE WHEN type = ${OrderType.TAKEOUT}  THEN 1 ELSE 0 END), 0) AS "takeoutCount",
        COALESCE(SUM(CASE WHEN type = ${OrderType.DELIVERY} THEN 1 ELSE 0 END), 0) AS "deliveryCount"
      FROM orders
      WHERE tenant_id = ${tenantId}
        AND DATE(created_at) = ${date}::date
        AND status != ${OrderStatus.CANCELLED}`;

    return this.mapReport(result[0] ?? {});
  }

  async getReportByRange(
    tenantId: string,
    branchId: string | null,
    from: string,
    to: string,
  ): Promise<DailyReportResult> {
    // `from` and `to` are UTC ISO strings (e.g. "2026-03-29T04:00:00.000Z")
    // so we compare directly against the stored UTC timestamps.
    const fromTs = new Date(from);
    const toTs   = new Date(to);

    const result = branchId
      ? await this.prisma.$queryRaw<[Record<string, unknown>]>`
          SELECT
            COALESCE(SUM(total), 0)                                                 AS "totalSales",
            COUNT(*)                                                                 AS "orderCount",
            COALESCE(AVG(total), 0)                                                 AS "averageTicket",
            COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.CASH}      THEN total ELSE 0 END), 0) AS "cashSales",
            COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.QR}        THEN total ELSE 0 END), 0) AS "qrSales",
            COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.TRANSFER}  THEN total ELSE 0 END), 0) AS "transferSales",
            COALESCE(SUM(CASE WHEN type = ${OrderType.DINE_IN}  THEN 1 ELSE 0 END), 0) AS "dineInCount",
            COALESCE(SUM(CASE WHEN type = ${OrderType.TAKEOUT}  THEN 1 ELSE 0 END), 0) AS "takeoutCount",
            COALESCE(SUM(CASE WHEN type = ${OrderType.DELIVERY} THEN 1 ELSE 0 END), 0) AS "deliveryCount"
          FROM orders
          WHERE tenant_id = ${tenantId}
            AND branch_id = ${branchId}
            AND created_at BETWEEN ${fromTs} AND ${toTs}
            AND status != ${OrderStatus.CANCELLED}`
      : await this.prisma.$queryRaw<[Record<string, unknown>]>`
          SELECT
            COALESCE(SUM(total), 0)                                                 AS "totalSales",
            COUNT(*)                                                                 AS "orderCount",
            COALESCE(AVG(total), 0)                                                 AS "averageTicket",
            COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.CASH}      THEN total ELSE 0 END), 0) AS "cashSales",
            COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.QR}        THEN total ELSE 0 END), 0) AS "qrSales",
            COALESCE(SUM(CASE WHEN payment_method = ${PaymentMethod.TRANSFER}  THEN total ELSE 0 END), 0) AS "transferSales",
            COALESCE(SUM(CASE WHEN type = ${OrderType.DINE_IN}  THEN 1 ELSE 0 END), 0) AS "dineInCount",
            COALESCE(SUM(CASE WHEN type = ${OrderType.TAKEOUT}  THEN 1 ELSE 0 END), 0) AS "takeoutCount",
            COALESCE(SUM(CASE WHEN type = ${OrderType.DELIVERY} THEN 1 ELSE 0 END), 0) AS "deliveryCount"
          FROM orders
          WHERE tenant_id = ${tenantId}
            AND created_at BETWEEN ${fromTs} AND ${toTs}
            AND status != ${OrderStatus.CANCELLED}`;

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
      productId: r.productId,
      productName: r.productName,
      categoryId: r.categoryId ?? null,
      categoryName: r.categoryName ?? null,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: Number(r.totalRevenue),
    }));
  }

  private mapReport(row: Record<string, unknown>): DailyReportResult {
    return {
      totalSales: Number(row.totalSales ?? 0),
      orderCount: Number(row.orderCount ?? 0),
      averageTicket: Number(row.averageTicket ?? 0),
      paymentBreakdown: {
        cash: Number(row.cashSales ?? 0),
        qr: Number(row.qrSales ?? 0),
        transfer: Number(row.transferSales ?? 0),
      },
      ordersByType: {
        dineIn: Number(row.dineInCount ?? 0),
        takeout: Number(row.takeoutCount ?? 0),
        delivery: Number(row.deliveryCount ?? 0),
      },
    };
  }
}
