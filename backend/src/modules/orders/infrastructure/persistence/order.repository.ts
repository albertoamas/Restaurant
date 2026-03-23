import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus, OrderType, PaymentMethod } from '@pos/shared';
import { Order } from '../../domain/entities/order.entity';
import {
  DailyReportResult,
  OrderFilters,
  OrderRepositoryPort,
} from '../../domain/ports/order-repository.port';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderMapper } from './order.mapper';

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repo: Repository<OrderOrmEntity>,
  ) {}

  async save(order: Order): Promise<Order> {
    const orm = OrderMapper.toOrm(order);
    const saved = await this.repo.save(orm);
    return OrderMapper.toDomain(saved);
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const orm = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['items'],
    });

    return orm ? OrderMapper.toDomain(orm) : null;
  }

  async findAll(tenantId: string, filters: OrderFilters = {}): Promise<Order[]> {
    const { date, status, page = 1, limit = 50 } = filters;

    const qb = this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.tenant_id = :tenantId', { tenantId })
      .orderBy('order.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (date) {
      qb.andWhere('DATE(order.created_at) = :date', { date });
    }

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    const results = await qb.getMany();
    return results.map((orm) => OrderMapper.toDomain(orm));
  }

  async getNextOrderNumber(tenantId: string, date: Date): Promise<number> {
    const dateString = date.toISOString().split('T')[0];

    const result = await this.repo.query(
      `SELECT COALESCE(MAX(order_number), 0) + 1 AS next_number
       FROM orders
       WHERE tenant_id = $1
         AND DATE(created_at) = $2`,
      [tenantId, dateString],
    );

    return Number(result[0]?.next_number ?? 1);
  }

  async getDailyReport(tenantId: string, date: string): Promise<DailyReportResult> {
    const rows = await this.repo.query(
      `SELECT
         COALESCE(SUM(total), 0)                                                 AS "totalSales",
         COUNT(*)                                                                  AS "orderCount",
         COALESCE(AVG(total), 0)                                                  AS "averageTicket",
         COALESCE(SUM(CASE WHEN payment_method = $3  THEN total ELSE 0 END), 0)  AS "cashSales",
         COALESCE(SUM(CASE WHEN payment_method = $4  THEN total ELSE 0 END), 0)  AS "qrSales",
         COALESCE(SUM(CASE WHEN payment_method = $5  THEN total ELSE 0 END), 0)  AS "transferSales",
         COALESCE(SUM(CASE WHEN type = $6 THEN 1 ELSE 0 END), 0)                AS "dineInCount",
         COALESCE(SUM(CASE WHEN type = $7 THEN 1 ELSE 0 END), 0)                AS "takeoutCount",
         COALESCE(SUM(CASE WHEN type = $8 THEN 1 ELSE 0 END), 0)                AS "deliveryCount"
       FROM orders
       WHERE tenant_id = $1
         AND DATE(created_at) = $2
         AND status != $9`,
      [
        tenantId,
        date,
        PaymentMethod.CASH,
        PaymentMethod.QR,
        PaymentMethod.TRANSFER,
        OrderType.DINE_IN,
        OrderType.TAKEOUT,
        OrderType.DELIVERY,
        OrderStatus.CANCELLED,
      ],
    );

    const row = rows[0] ?? {};

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
