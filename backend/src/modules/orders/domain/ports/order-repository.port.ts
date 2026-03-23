import { OrderStatus } from '@pos/shared';
import { Order } from '../entities/order.entity';

export interface OrderFilters {
  date?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface DailyReportResult {
  totalSales: number;
  orderCount: number;
  averageTicket: number;
  paymentBreakdown: {
    cash: number;
    qr: number;
    transfer: number;
  };
  ordersByType: {
    dineIn: number;
    takeout: number;
    delivery: number;
  };
}

export interface OrderRepositoryPort {
  save(order: Order): Promise<Order>;
  findById(id: string, tenantId: string): Promise<Order | null>;
  findAll(tenantId: string, filters?: OrderFilters): Promise<Order[]>;
  getNextOrderNumber(tenantId: string, date: Date): Promise<number>;
  getDailyReport(tenantId: string, date: string): Promise<DailyReportResult>;
}
