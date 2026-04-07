import client from './client';
import type { OrderNumberResetPeriod } from '@pos/shared';

export interface TenantSettingsPayload {
  orderNumberResetPeriod?: OrderNumberResetPeriod;
}

export const tenantsApi = {
  updateSettings: (payload: TenantSettingsPayload) =>
    client.patch('/api/v1/tenants/settings', payload).then((r) => r.data),
};
