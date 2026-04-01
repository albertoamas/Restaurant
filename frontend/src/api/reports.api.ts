import client from './client';
import type { DailyReportDto, TopProductDto } from '@pos/shared';

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
          ...(branchId ? { branchId } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
      })
      .then((r) => r.data),
};
