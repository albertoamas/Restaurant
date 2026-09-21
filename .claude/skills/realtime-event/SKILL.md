---
name: realtime-event
description: End-to-end recipe for adding or changing a Socket.IO real-time event across packages/shared, the NestJS backend emitter and the React subscriber. Use when a change must push live updates to open clients, or when touching SOCKET_EVENTS, EventsService or useSocketEvent.
---

# Adding a real-time event

Three files, always in this order. Never use a raw event-name string on either side.

## 1. Declare it in shared

`packages/shared/src/socket-events.ts`:

```ts
export const SOCKET_EVENTS = {
  // ...
  EXPENSE_CREATED: 'expense.created',
} as const;
```

Naming: `<resource>.<past-tense-verb>` in lowercase dot form.
Then rebuild so the backend (which imports from `dist/`) sees it:

```bash
pnpm --filter @pos/shared build
```

## 2. Emit from the backend use case

```ts
import { SOCKET_EVENTS } from '@pos/shared';
import { EventsService } from '../../../events/events.service';

constructor(
  @Inject(EXPENSE_REPOSITORY_PORT) private readonly repo: ExpenseRepositoryPort,
  @Optional() private readonly eventsService?: EventsService,
) {}

this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CREATED, payload);
```

- Emit **after** the write succeeds, never before.
- `@Optional()` keeps unit tests able to build the use case with only the repo mock.
- The module must import `EventsModule`.
- The gateway joins each socket to `tenant:{tenantId}` and `t:{tenantId}:b:{branchId}`; use the
  branch-scoped emitter only for branch-local views (kitchen, cash session).
- Payload: send the same DTO the REST endpoint returns, so subscribers need no second shape.

## 3. Subscribe on the frontend

In the hook that owns the affected query — not in a component:

```ts
const invalidate = useCallback(() => {
  queryClient.invalidateQueries({ queryKey: queryKeys.expenses(from, to, branchId) });
}, [queryClient, from, to, branchId]);

useSocketEvent(SOCKET_EVENTS.EXPENSE_CREATED, invalidate);
```

Prefer invalidating over writing the payload into the cache — it keeps one source of truth and
survives missed events. `useSocketEvent` cleans up on unmount.

## Checklist

- [ ] Entry in `SOCKET_EVENTS`, `pnpm --filter @pos/shared build` run
- [ ] Emitted from the use case (after persistence) via `EventsService`
- [ ] Module imports `EventsModule`
- [ ] Every hook showing that data subscribes and invalidates its key
- [ ] Doc table in `CLAUDE.md` updated if the event list changed
- [ ] Typecheck both packages
