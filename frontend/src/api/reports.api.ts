import client from './client';
import type { DailyReportDto } from '@pos/shared';

export const reportsApi = {
  getDaily: (date?: string) =>
    client
      .get<DailyReportDto>('/api/v1/reports/daily', { params: date ? { date } : {} })
      .then((r) => r.data),
};
