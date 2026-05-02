import { useAuth } from '../context/auth.context';
import { useSettingsStore } from '../store/settings.store';
import type { ReceiptSettings } from '../utils/print';

export function useReceiptSettings(): ReceiptSettings {
  const { user } = useAuth();
  const { businessAddress, businessPhone, receiptSlogan, tenantLogo } = useSettingsStore();
  return {
    businessName:    user?.tenantName ?? 'Mi Negocio',
    businessAddress,
    businessPhone,
    receiptSlogan,
    logoUrl:         tenantLogo,
  };
}
