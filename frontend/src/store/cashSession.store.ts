import { create } from 'zustand';
import type { CashSessionDto } from '@pos/shared';
import { CashSessionStatus } from '@pos/shared';

interface CashSessionStore {
  /** Current session for the active branch. `null` = no open session. `undefined` = not yet fetched. */
  session: CashSessionDto | null | undefined;
  setSession: (session: CashSessionDto | null) => void;
  /** True only when the session is explicitly OPEN */
  isOpen: () => boolean;
}

export const useCashSessionStore = create<CashSessionStore>((set, get) => ({
  session: undefined,

  setSession: (session) => set({ session }),

  isOpen: () => get().session?.status === CashSessionStatus.OPEN,
}));
