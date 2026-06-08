import client from './client';
import type {
  CashierReportDto,
  CashSessionReportItemDto,
  DailyReportDto,
  DailySeriesItemDto,
  DayHourDataDto,
  HourlyDataDto,
  TopCategoryDto,
  TopCustomerDto,
  TopProductDto,
} from '@pos/shared';

export const reportsApi = {
  getDaily: (date?: string) =>
    client
      .get<DailyReportDto>('/api/v1/reports/daily', { params: date ? { date } : {} })
      .then((r) => r.data),

  getByRange: (from: string, to: string, branchId?: string) =>
    client
      .get<DailyReportDto>('/api/v1/reports/range', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getTopProducts: (from: string, to: string, branchId?: string, categoryId?: string) =>
    client
      .get<TopProductDto[]>('/api/v1/reports/top-products', {
        params: {
          from,
          to,
          ...(branchId    ? { branchId }    : {}),
          ...(categoryId  ? { categoryId }  : {}),
        },
      })
      .then((r) => r.data),

  getTopCustomers: (from: string, to: string, branchId?: string) =>
    client
      .get<TopCustomerDto[]>('/api/v1/reports/top-customers', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getDailySeries: (from: string, to: string, branchId?: string) =>
    client
      .get<DailySeriesItemDto[]>('/api/v1/reports/daily-series', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getByCashier: (from: string, to: string, branchId?: string) =>
    client
      .get<CashierReportDto[]>('/api/v1/reports/by-cashier', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getTopCategories: (from: string, to: string, branchId?: string) =>
    client
      .get<TopCategoryDto[]>('/api/v1/reports/top-categories', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getByHour: (from: string, to: string, branchId?: string) =>
    client
      .get<HourlyDataDto[]>('/api/v1/reports/by-hour', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getCashSessions: (from: string, to: string, branchId?: string) =>
    client
      .get<CashSessionReportItemDto[]>('/api/v1/reports/cash-sessions', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  getByDayHour: (from: string, to: string, branchId?: string) =>
    client
      .get<DayHourDataDto[]>('/api/v1/reports/by-day-hour', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),
};
