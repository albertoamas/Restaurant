---
name: e2e-test
description: How to write and run this repo's Playwright E2E tests (Node @playwright/test in e2e/, against the seeded dev stack). Use when adding or fixing an end-to-end test, or when a change to a user flow (login, POS order, cash session, kitchen…) should be checked in a real browser.
paths: e2e/**
---

# E2E tests (Playwright)

Node `@playwright/test`, config in `playwright.config.ts` at the repo root, specs in `e2e/*.spec.ts`
(`auth`, `order-flow`, `cash-session`). Chromium only, **sequential** (`fullyParallel: false`)
because every spec shares the same seeded database.

## Running

```bash
docker-compose up -d                  # postgres on :5433
pnpm --filter backend seed            # local DB only — never production
pnpm test:e2e                         # starts backend :3000 + frontend :5173 if not running
pnpm exec playwright test e2e/order-flow.spec.ts
pnpm exec playwright test --headed    # watch it
```

`webServer` reuses servers already running outside CI, so a `pnpm dev` in another terminal is fine.
Tests run against the Vite **dev** server: no service worker is registered there.

## Writing a spec

- Log in through the UI with the seed credentials (`owner@demo.com` / `cajero@demo.com`,
  password `demo123`), then wait for `/pos`. OWNER may land without a branch: copy the
  `loginAsOwner` helper (it picks the first branch when "Seleccionar sucursal" shows).
- Locators, in order of preference: `getByRole` / `getByLabel` with a Spanish regex
  (`/abrir caja/i`), then `data-testid` (e.g. `product-card`). Never Tailwind classes.
  If a new element needs a hook, add a `data-testid` in the component.
- **State leaks between tests** (a cash session opened in one spec is still open in the next).
  Write tests that accept either starting state — wait for whichever of the two buttons
  appears, then branch — as `cash-session.spec.ts` does, instead of assuming a fresh DB.
- Wait on UI conditions (`expect(...).toBeVisible()`, `waitForURL`), not `waitForTimeout`.
- UI text is Spanish; error toasts come verbatim from backend use cases.

## Scope

E2E covers critical money flows (login, order + payment, cash open/close). Business rules belong
in backend unit tests (`*.use-case.spec.ts`); don't duplicate them here. E2E is not part of the
default `verify` chain — run it when a flow it covers changed.
