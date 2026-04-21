import client from './client';
import type { PlanDto } from '@pos/shared';

export const plansApi = {
  getAll: () => client.get<PlanDto[]>('/api/v1/plans').then((r) => r.data),
};
