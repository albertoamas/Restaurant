---
name: verify
description: Run this repo's full validation chain in the right order — shared build, typecheck, lint and unit tests for backend and frontend. Use before finishing any change, or when the user asks to verify, check or validate the code.
allowed-tools: Bash(pnpm *)
---

# Verify the workspace

Run in this order — `@pos/shared` **must** build first, because the backend resolves it from
`dist/` and the frontend from `src/`; a stale `dist/` produces phantom type errors.

```bash
pnpm --filter @pos/shared build
pnpm --filter backend typecheck
pnpm --filter frontend typecheck
pnpm --filter backend lint          # zero-warning policy; `any` is an error
pnpm test:backend                   # jest
pnpm test:frontend                  # vitest
```

Scope it to what changed: shared-types change → everything; frontend-only change → shared build
(if types moved) + frontend typecheck + vitest.

Single files:

```bash
pnpm --filter backend test -- --testPathPattern="create-order"
pnpm --filter frontend test:run -- src/store/cart.store.spec.ts
```

E2E needs the app running (`pnpm dev`, backend :3000 / frontend :5173, `docker-compose up -d`
first) and is not part of the default chain:

```bash
pnpm test:e2e
```

## Reporting

The automated suite is **not** comprehensive — typecheck + lint passing is not proof the feature
works. Say which commands ran, paste real failures rather than summarising them, and name the
screens or flows that still need a manual pass.
