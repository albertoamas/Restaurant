import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderNumberResetPeriod, SaasPlan, PlanLimits } from '@pos/shared';

interface SettingsState {
  // Impresión
  autoPrintKitchen: boolean;
  setAutoPrintKitchen: (value: boolean) => void;

  // Panel de cocina (server-controlled — set by auth context on login/getMe)
  kitchenEnabled: boolean;
  setKitchenEnabled: (value: boolean) => void;

  // Módulos opcionales (server-controlled — set by auth context on login/getMe)
  ordersEnabled: boolean;
  cashEnabled: boolean;
  teamEnabled: boolean;
  branchesEnabled: boolean;
  setOrdersEnabled: (value: boolean) => void;
  setCashEnabled: (value: boolean) => void;
  setTeamEnabled: (value: boolean) => void;
  setBranchesEnabled: (value: boolean) => void;

  // Numeración de pedidos (server-controlled — set by auth context on login/getMe)
  orderNumberResetPeriod: OrderNumberResetPeriod;
  setOrderNumberResetPeriod: (value: OrderNumberResetPeriod) => void;

  // Sistema de fichas de sorteo
  raffleThreshold: number;
  setRaffleThreshold: (value: number) => void;

  // Datos del negocio (server-controlled — set by auth context on login/getMe)
  businessAddress: string;
  businessPhone: string;
  receiptSlogan: string;
  setBusinessAddress: (value: string) => void;
  setBusinessPhone: (value: string) => void;
  setReceiptSlogan: (value: string) => void;

  // Logo del negocio (server-controlled — set by auth context on login/getMe)
  tenantLogo: string | null;
  setTenantLogo: (value: string | null) => void;

  // Plan SaaS (server-controlled — set by auth context on login/getMe)
  plan: SaasPlan;
  setPlan: (value: SaasPlan) => void;
  planLimits: PlanLimits;
  setPlanLimits: (value: PlanLimits) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Runtime defaults — overwritten by server values on every login/getMe
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

      orderNumberResetPeriod: 'DAILY' as OrderNumberResetPeriod,
      setOrderNumberResetPeriod: (value) => set({ orderNumberResetPeriod: value }),

      raffleThreshold: 100,
      setRaffleThreshold: (value) => set({ raffleThreshold: value }),

      businessAddress: '',
      businessPhone: '',
      receiptSlogan: '',
      setBusinessAddress: (value) => set({ businessAddress: value }),
      setBusinessPhone:   (value) => set({ businessPhone: value }),
      setReceiptSlogan:   (value) => set({ receiptSlogan: value }),

      tenantLogo: null,
      setTenantLogo: (value) => set({ tenantLogo: value }),

      plan: 'BASICO' as SaasPlan,
      setPlan: (value) => set({ plan: value }),
      planLimits: { maxBranches: 1, maxCashiers: 2, maxProducts: 80, kitchenEnabled: false } as PlanLimits,
      setPlanLimits: (value) => set({ planLimits: value }),
    }),
    {
      name: 'pos-settings',
      // Only persist local UI preferences.
      // Module flags come from the server on every login/getMe — never from localStorage.
      // Only persist local UI preferences.
      // businessAddress/Phone/receiptSlogan come from server on every login — never from localStorage.
      partialize: (state) => ({
        autoPrintKitchen: state.autoPrintKitchen,
        raffleThreshold:  state.raffleThreshold,
      }),
    },
  ),
);
