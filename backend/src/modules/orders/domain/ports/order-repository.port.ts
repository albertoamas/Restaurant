import { OrderStatus, PaymentMethod, TopCustomerDto, TopProductDto } from '@pos/shared';
import { Order } from '../entities/order.entity';

export interface OrderFilters {
  date?: string;
  from?: string;
  to?: string;
  status?: OrderStatus;
  branchId?: string;
  customerId?: string;
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
    cortesia: number;
  };
  ordersByType: {
    dineIn: number;
    takeout: number;
    delivery: number;
  };
}

export interface OrderRepositoryPort {
  save(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  findById(id: string, tenantId: string): Promise<Order | null>;
  findAll(tenantId: string, filters?: OrderFilters): Promise<{ data: Order[]; total: number }>;
  getNextOrderNumber(tenantId: string, branchId: string, boliviaDateStr: string, resetPeriod?: string): Promise<number>;
  registerPayments(
    orderId: string,
    tenantId: string,
    payments: { id: string; method: PaymentMethod; amount: number }[],
    dominantMethod: PaymentMethod,
  ): Promise<Order>;
  getDailyReport(tenantId: string, date: string, branchId?: string | null): Promise<DailyReportResult>;
  getReportByRange(tenantId: string, branchId: string | null, from: string, to: string): Promise<DailyReportResult>;
  getTopProducts(tenantId: string, branchId: string | null, from: string, to: string, categoryId?: string, limit?: number): Promise<TopProductDto[]>;
  getTopCustomers(tenantId: string, branchId: string | null, from: string, to: string, limit?: number): Promise<TopCustomerDto[]>;
  resetOrderSequences(tenantId: string, periods: string[]): Promise<void>;
}
