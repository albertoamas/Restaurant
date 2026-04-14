import client from './client';
import type { OrderNumberResetPeriod } from '@pos/shared';

export interface TenantSettingsPayload {
  orderNumberResetPeriod?: OrderNumberResetPeriod;
  logoUrl?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  receiptSlogan?: string | null;
}

export const tenantsApi = {
  updateSettings: (payload: TenantSettingsPayload) =>
    client.patch('/api/v1/tenants/settings', payload).then((r) => r.data),
};
