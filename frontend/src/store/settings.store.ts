import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Impresión
  autoPrintKitchen: boolean;
  setAutoPrintKitchen: (value: boolean) => void;

  // Panel de cocina
  kitchenEnabled: boolean;
  setKitchenEnabled: (value: boolean) => void;

  // Módulos opcionales
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  setOrdersEnabled: (value: boolean) => void;
  setCashEnabled: (value: boolean) => void;
  setTeamEnabled: (value: boolean) => void;
  setBranchesEnabled: (value: boolean) => void;

  // Datos del negocio (para recibos)
  businessAddress: string;
  businessPhone: string;
  receiptFooter: string;
  setBusinessAddress: (value: string) => void;
  setBusinessPhone: (value: string) => void;
  setReceiptFooter: (value: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoPrintKitchen: true,
      setAutoPrintKitchen: (value) => set({ autoPrintKitchen: value }),

      kitchenEnabled: false,
      setKitchenEnabled: (value) => set({ kitchenEnabled: value }),

      ordersEnabled: true,
      cashEnabled: true,
      teamEnabled: true,
      branchesEnabled: true,
      setOrdersEnabled: (value) => set({ ordersEnabled: value }),
      setCashEnabled: (value) => set({ cashEnabled: value }),
      setTeamEnabled: (value) => set({ teamEnabled: value }),
      setBranchesEnabled: (value) => set({ branchesEnabled: value }),

      businessAddress: '',
      businessPhone: '',
      receiptFooter: '¡Gracias por su compra!',
      setBusinessAddress: (value) => set({ businessAddress: value }),
      setBusinessPhone: (value) => set({ businessPhone: value }),
      setReceiptFooter: (value) => set({ receiptFooter: value }),
    }),
    { name: 'pos-settings' },
  ),
);
