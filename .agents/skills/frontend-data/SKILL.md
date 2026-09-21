---
name: frontend-data
description: Conventions for the React frontend data layer — Axios api/ functions, TanStack Query hooks, centralised query keys, Zustand stores, socket-driven invalidation and error handling. Use when adding or changing anything under frontend/src/api, frontend/src/hooks, frontend/src/store or a page that fetches data.
paths: frontend/**
---

# Frontend data layer conventions

Layering is strict: `api/` (no state) → `hooks/` (fetch + state) → `pages`/`components`.
A component never calls Axios directly, and an `api/` module never touches React.

## 1. api/ — one object per resource

```ts
// frontend/src/api/raffles.api.ts
import client from './client';
import type { RaffleDto } from '@pos/shared';

export const rafflesApi = {
  getAll: (): Promise<RaffleDto[]> =>
    client.get<RaffleDto[]>('/api/v1/raffles').then((r) => r.data),
  create: (data: CreateRaffleRequest): Promise<RaffleDto> =>
    client.post<RaffleDto>('/api/v1/raffles', data).then((r) => r.data),
};
```

Always the full `/api/v1/...` path (Vite proxies `/api`, `/uploads`, `/socket.io` to :3000).
Request/response types come from `@pos/shared` — never redeclare them locally.
`client.ts` injects the JWT from `localStorage['pos_token']` and redirects to `/login` on 401.

## 2. query-keys.ts is the single source of keys

Add the key to `frontend/src/lib/query-keys.ts` — static tuple or factory function — and import
it. Never inline a raw array in `useQuery` or `invalidateQueries`.

```ts
raffles:      ['raffles'] as const,
raffleDetail: (id: string) => ['raffles', id] as const,
```

## 3. hooks/ — TanStack Query + socket invalidation

`QueryClient` defaults (`frontend/src/lib/query-client.ts`): `staleTime: 30_000`,
`refetchOnWindowFocus: false`, `retry: 1`. Freshness comes from WebSocket events, not polling.

```ts
export function useRaffles() {
  const queryClient = useQueryClient();

  const { data: raffles = [], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.raffles,
    queryFn:  () => rafflesApi.getAll(),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.RAFFLE_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.RAFFLE_UPDATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.RAFFLE_DELETED, invalidate);

  return { raffles, loading, reload: refetch };
}
```

For real-time views (orders, kitchen, cash session) the pattern is **adaptive polling**: poll only
while `useSocket().connected === false`, and invalidate once on reconnect. Copy it from
`useOrders`/`useKitchenOrders` rather than adding a fixed `refetchInterval`.

## 4. Errors

Every `catch` uses `handleApiError(err, 'mensaje por defecto')` from `frontend/src/utils/api-error.ts`
(shows a toast). Use `getApiErrorMessage` when you need the string without the toast. No inline
`err.response.data.message` digging, no `catch (err: any)`.

## 5. Stores (Zustand, `frontend/src/store/`)

- `cart.store.ts` — persisted; cleared after a successful order.
- `settings.store.ts` — persisted with `partialize`. **Server-controlled flags
  (`kitchenEnabled`, module flags, `orderNumberResetPeriod`) must stay out of the persisted set** —
  they are re-applied by `applyModules()` in `auth.context.tsx` on every login/`/auth/me`.
- `cashSession.store.ts` — current open session; `isOpen()` checks the branch matches.

Client state → store. Server state → React Query. Don't mirror server data into a store.

## 6. Branch context

`useAuth()` gives `{ user, token, currentBranchId, login, logout }`. For an OWNER,
`currentBranchId` is `null` until a branch is picked (auto-selected when there's only one), so any
query that depends on a branch must include `currentBranchId` in its key and usually be `enabled`
only when it is set.

## 7. Routes

New owner-only page → wrap in `OwnerRoute`; feature behind a module flag → also the inline
`ModuleRoute` in `App.tsx`, so a direct URL redirects to `/pos` when the admin disabled it.

Check with `pnpm --filter frontend typecheck` (and `pnpm --filter @pos/shared build` first if
shared types changed).
