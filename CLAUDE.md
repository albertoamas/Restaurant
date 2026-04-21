# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

**Monorepo** managed with pnpm workspaces (`pnpm-workspace.yaml`). Three packages:
- `backend/` — NestJS 11 + Prisma 6 + PostgreSQL
- `frontend/` — React 19 + Vite 5 + Tailwind CSS 4
- `packages/shared/` — TypeScript types shared between front and back (`@pos/shared`)

**Key versions:** TypeScript 5.6, React Router 6, Zustand 5, Socket.IO 4, JWT via `@nestjs/jwt` + `passport-jwt`.

## Prerequisites

- Node.js ≥ 18, pnpm ≥ 8, Docker Desktop

## First-Time Setup

```bash
pnpm install
docker-compose up -d
pnpm --filter backend prisma:migrate
pnpm --filter backend prisma:generate
pnpm --filter backend seed
pnpm dev
```

**Demo credentials** (after seed): `admin@hamburgos.com / demo123` (OWNER), `cajero@hamburgos.com / demo123` (CASHIER). Business: "HamBurgos", branches: Centro · Norte.

> **WARNING:** Never run `seed` in production. It creates a demo tenant with well-known credentials.

## Development Commands

```bash
# Start PostgreSQL (required before running backend)
docker-compose up -d

# Run both frontend and backend concurrently
pnpm dev

# Run individually
pnpm dev:backend    # NestJS on :3000
pnpm dev:frontend   # Vite on :5173

# Seed the database with demo data (tenant, owner, cashier, branches, products)
pnpm --filter backend seed

# Type-check
pnpm --filter @pos/shared build          # MUST run first after editing shared types
pnpm --filter backend typecheck
pnpm --filter frontend typecheck

# Tests
pnpm test:backend                        # Jest (38 unit/integration tests)
pnpm test:frontend                       # Vitest (30 unit tests)
pnpm test:e2e                            # Playwright (9 E2E tests — requires pnpm dev running)

# Run a single backend test file
pnpm --filter backend test -- --testPathPattern="create-order"

# Run a single frontend test file
pnpm --filter frontend test:run -- src/store/cart.store.spec.ts

# Prisma commands (run from repo root — pnpm filter sets the right cwd)
pnpm --filter backend prisma:generate        # Regenerate client after schema changes
pnpm --filter backend prisma:migrate         # Create + apply migration (dev)
pnpm --filter backend prisma:migrate:deploy  # Apply pending migrations (production)
pnpm --filter backend prisma:migrate:status  # Check migration status
pnpm --filter backend prisma:studio          # Visual DB browser on :5555

# Build
pnpm build
```

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to `localhost:3000`.

**PostgreSQL connection** (docker-compose): host `localhost:5433`, db `pos_db`, user `pos_user`, password `pos_password`.

## Known Windows Gotchas

- **`prisma migrate dev` advisory lock timeout**: On Windows the migrate command can time out waiting for a DB lock. Workaround: apply the SQL manually via `docker exec pos-postgres psql -U pos_user -d pos_db -c "..."`, then register it with `npx prisma migrate resolve --applied <migration_name>` (run from `backend/`).
- **`prisma generate` EPERM**: The Prisma binary is locked while the backend is running. Stop `pnpm dev:backend` first, generate, then restart.
- **pnpm strict hoisting**: Installing a new package can rewrite `backend/package.json`'s `onlyBuiltDependencies` array, removing Prisma entries. After `pnpm add`, always check that `@prisma/engines`, `@prisma/client`, and `prisma` are still listed there; revert with `git checkout -- backend/package.json` if needed.

## Backend Architecture

### Hexagonal (ports & adapters) per module

Every NestJS module under `backend/src/modules/` follows this layout:
```
domain/
  entities/      ← pure TS classes (no ORM decorators), e.g. Order.create()
  ports/         ← repository interfaces
application/
  use-cases/     ← one class per operation, injected via DI
  dto/           ← class-validator DTOs
infrastructure/
  controllers/   ← NestJS @Controller, calls use-cases
  persistence/   ← Repository impl (PrismaService, maps rows ↔ domain)
```

Repositories are registered with a string token (`'OrderRepositoryPort'`) and injected with `@Inject('OrderRepositoryPort')` — never with the class directly.

### Multi-tenancy

Shared database / shared schema. Every table has `tenant_id`. The JWT payload carries `{ sub, tenantId, branchId, role }`. Use `@CurrentTenant()` to extract `tenantId` in controllers; repositories always filter by it.

`@CurrentUser()` returns the full `JwtPayload` (defined in `common/decorators/tenant.decorator.ts`).

`CASHIER` users have `branchId` baked into their JWT; `OWNER` users have `branchId: null` and pass it in the request body/query.

### Authorization

Three guards in `backend/src/common/guards/`:

- `JwtAuthGuard` — verifies JWT, required on almost all endpoints
- `RolesGuard` + `@Roles(UserRole.OWNER)` — restricts endpoints to owners
- `AdminGuard` — checks `x-admin-key` header against `ADMIN_SECRET`; no JWT; used only on `/admin/*`

### Real-time (WebSockets)

`EventsModule` exports `EventsService`. Use cases call `eventsService.emitToTenant(tenantId, event, payload)`. Events: `order.created`, `order.updated`, `cash.opened`, `cash.closed`.

The gateway joins sockets to `tenant:{tenantId}` and `t:{tenantId}:b:{branchId}` rooms.

### Modules overview

| Module | Key endpoints | Notes |
|--------|--------------|-------|
| `auth` | `POST /auth/login`, `GET /auth/me`, `POST /auth/users` | Cashier management; JWT |
| `tenant` | `PATCH /tenants/settings` | Owner-only; `orderNumberResetPeriod` (DAILY/MONTHLY) |
| `branch` | `GET/POST /branches`, `PATCH /branches/:id` | |
| `catalog` | `GET/POST /categories`, `GET/POST /products` | Pagination via `X-Total-Count` header |
| `orders` | `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `POST /orders/:id/payments` | Split payments; price snapshot. `:id/payments` registers deferred payment. |
| `cash-session` | `POST /cash-sessions/open`, `POST /cash-sessions/close` | Per-branch; cash-only flow |
| `reports` | `GET /reports/daily`, `GET /reports/range`, `GET /reports/top-products` | Raw SQL aggregation |
| `upload` | `POST /uploads/image` | multer; 2 MB; JPG/PNG/WEBP/GIF; served at `/uploads/<file>` |
| `expenses` | `POST/GET /expenses` | OWNER only; per cash session |
| `customers` | `GET/POST /customers`, `GET /customers/search` | Order history; ticket/raffle tracking |
| `admin` | `GET/POST /admin/tenants`, `PATCH /admin/tenants/:id/toggle`, `PATCH /admin/tenants/:id/plan`, `GET/PATCH /admin/plans` | `AdminGuard`; no JWT |
| `events` | WebSocket gateway | Socket.IO rooms per tenant/branch |

### Rate Limiting

Global 100 req/min via `ThrottlerModule` (`app.module.ts`). Login has a stricter `@Throttle`.

## Frontend Architecture

Layered (not hexagonal):
```
api/         ← Axios functions per resource (no state)
hooks/       ← custom hooks: fetch + state (useProducts, useOrders, …)
store/       ← Zustand stores: cart.store.ts, settings.store.ts, cashSession.store.ts
context/     ← auth.context.tsx (user/token/branchId), socket.context.tsx
pages/       ← route-level components
components/  ← ui/, layout/, pos/, orders/, products/, cash/, expenses/
utils/       ← date.ts (today, formatDate, elapsed), api-error.ts, print.ts, order.ts
routes/      ← PrivateRoute, OwnerRoute
```

### Route structure

```
/           ← LandingPage (public)
/login      ← public
/admin      ← public (x-admin-key only)
/kitchen    ← auth, fullscreen (no sidebar)
/* AppLayout:
  /pos       /orders    /cash      ← CASHIER + OWNER
  /report    /expenses  /customers
  /products  /team      /branches  ← OWNER only
  /settings
```

Unknown routes redirect to `/`. No public self-registration.

### State architecture

- **`cart.store.ts`** (Zustand + persist): cart items, order type, notes. Cleared after a successful order.
- **`settings.store.ts`** (Zustand + persist with `partialize`): UI toggles (`autoPrintKitchen`, `cashEnabled`, module flags). Server-controlled flags (`kitchenEnabled`, `orderNumberResetPeriod`) are **not** persisted to localStorage — they are set via `applyModules()` in `auth.context.tsx` on every login/me call.
- **`cashSession.store.ts`**: current open session; `isOpen()` checks branch match.

### Auth & branch selection

`useAuth()` exposes `{ user, token, currentBranchId, login, logout }`. When an OWNER logs in, `currentBranchId` is `null` until they select a branch from the Sidebar. If there is only one branch, it is auto-selected. `currentBranchId` is stored in `localStorage` (`pos_branch` key) via `auth.context.tsx`, so it persists across tabs and sessions. It is cleared on logout.

### Socket context

`useSocketEvent<T>(event, handler)` subscribes a component to a Socket.IO event. Subscriptions are cleaned up on unmount. The socket connects with `auth: { token }` from JWT.

## Data Model

12 tables. `Plan` is global (no `tenant_id`); all others are scoped by `tenant_id`:

```
Plan (global) ── Tenant ──┬── User (OWNER / CASHIER, optional branchId)
                           ├── Branch
                           ├── Category ── Product (price, imageUrl)
                           ├── Order ──┬── OrderItem  (productName + unitPrice snapshot)
                           │           └── OrderPayment  (method, amount — N per order)
                           ├── CashSession ── Expense (category, amount, description)
                           └── Customer (name, phone, email, ticketsDelivered)
```

Prisma schema: `backend/prisma/schema.prisma`. All enums stored as plain strings in DB.

### Split payments

`Order.paymentMethod` stores the **dominant** method (highest amount) for backward compat and display. The `order_payments` table stores one row per partial payment. Use cases validate that `SUM(payments.amount) == order.total` (±0.01 tolerance). Reports and cash-session totals aggregate from `order_payments`, not from `orders.payment_method`.

### SaaS plans and module flags

`Tenant.plan` references a `Plan` row (`BASICO` | `PRO` | `NEGOCIO`). Each plan defines capacity limits (`maxBranches`, `maxCashiers`, `maxProducts`, `kitchenEnabled`). Use cases check these limits before creating branches, cashiers, or products.

`Tenant` also has per-tenant module flags set exclusively by the admin (not the tenant owner): `ordersEnabled`, `cashEnabled`, `teamEnabled`, `branchesEnabled`, `kitchenEnabled`. These are read by `GET /auth/me` and applied client-side via `applyModules()` in `auth.context.tsx` every login — they populate `settings.store.ts` but are **not** persisted to localStorage.

### Tenant settings

`Tenant.orderNumberResetPeriod` (DAILY | MONTHLY) controls when `order_number` resets to 1. The SQL uses `DATE()` for daily and `DATE_TRUNC('month', …)` for monthly.

Timezone is handled correctly: `toBoliviaDateString()` in `backend/src/common/utils/timezone.util.ts` uses `America/La_Paz` (UTC-4) for all date calculations including order number resets.

## Shared Package

`packages/shared/src/` exports enums and DTO types. **The backend imports from the compiled `dist/` folder** (via tsconfig paths). Always run `pnpm --filter @pos/shared build` after editing shared types before typechecking the backend.

Key enums: `UserRole`, `OrderType`, `OrderStatus`, `PaymentMethod`, `CashSessionStatus`, `ExpenseCategory`, `OrderNumberResetPeriod`, `SaasPlan`.

## Environment Variables (backend)

Two template files exist:
- `backend/.env.example` — local dev defaults, copy to `backend/.env`
- `.env.production.example` — production template with `CHANGE_ME` placeholders, copy to `.env` on the VPS

```
DATABASE_URL     postgresql://...  (dev: localhost:5433/pos_db with pos_user/pos_password)
JWT_SECRET       Required. Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRATION   (default: 24h)
PORT             (default: 3000)
FRONTEND_URL     (default: http://localhost:5173) — used for CORS
ADMIN_SECRET     x-admin-key header value for /admin/* routes.
                 If unset, AdminGuard returns 401 — no fallback.
                 Dev default in backend/.env.example: dev-admin-secret
                 Production: must be set to a strong secret.
NODE_ENV         development | production
```

## CI/CD

`.github/workflows/deploy.yml` on every push to `main`:

1. **Validate** — `pnpm --filter @pos/shared build`, then `typecheck` backend + frontend.
2. **Build & push** — multi-stage Docker images → GitHub Container Registry (`ghcr.io`).
3. **Deploy** — SSH into VPS, update `IMAGE_TAG`, pull images, `docker-compose -f docker-compose.prod.yml up -d`.

Migrations run automatically on backend container start (`prisma migrate deploy` in entrypoint).

## Production Deployment

`docker-compose.prod.yml`: three services — `postgres`, `backend`, `frontend`/nginx.

- Uploads persist via Docker volume `uploads_data`. Backup script: `scripts/backup-db.sh` (pg_dump + uploads tar). Schedule with cron: `0 3 * * * /opt/pos/scripts/backup-db.sh`.
- nginx proxies `/api/`, `/uploads/`, `/socket.io/` to backend; stays on HTTP internally.
- `/uploads/<uuid>.<ext>` files are **publicly accessible** — any URL is guessable if the UUID leaks. Acceptable for product/logo images; do not store sensitive files here.
- TLS: Cloudflare orange-cloud proxy, SSL/TLS set to "Full".
