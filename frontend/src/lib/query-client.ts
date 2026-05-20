import { QueryClient } from '@tanstack/react-query';

/**
 * Real-time strategy:
 *  - WebSocket events keep operational data fresh (orders, cash, products, customers, raffles, …)
 *  - Adaptive polling kicks in only when the socket is down (see useOrders / useKitchenOrders / useCashSession)
 *  - On reconnection, hooks re-fetch immediately to recover events missed while offline
 *
 * That's why refetchOnWindowFocus is disabled globally: it would cause redundant requests
 * on every tab switch even though the data is already kept in sync. Screens that genuinely
 * need on-focus refresh can opt in per-query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      refetchOnWindowFocus: false,
      retry:                1,
    },
  },
});
