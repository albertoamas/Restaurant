# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

**Monorepo** managed with pnpm workspaces (`pnpm-workspace.yaml`). Three packages:
- `backend/` — NestJS 10 + Prisma 6 + PostgreSQL
- `frontend/` — React 18 + Vite 5 + Tailwind CSS 4
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

# Type-check (no tests exist — type-check is the main CI gate)
pnpm --filter @pos/shared build          # MUST run first after editing shared types
pnpm --filter backend typecheck
npx tsc --noEmit -p frontend/tsconfig.app.json   # or: cd frontend && npx tsc --noEmit

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
| `orders` | `POST /orders`, `GET /orders`, `PATCH /orders/:id/status` | Split payments; price snapshot |
| `cash-session` | `POST /cash-sessions/open`, `POST /cash-sessions/close` | Per-branch; cash-only flow |
| `reports` | `GET /reports/daily`, `GET /reports/range`, `GET /reports/top-products` | Raw SQL aggregation |
| `upload` | `POST /uploads/image` | multer; 2 MB; JPG/PNG/WEBP/GIF; served at `/uploads/<file>` |
| `expenses` | `POST/GET /expenses` | OWNER only; per cash session |
| `customers` | `GET/POST /customers`, `GET /customers/search` | Order history; ticket/raffle tracking |
| `admin` | `GET/POST /admin/tenants`, `PATCH /admin/tenants/:id/toggle` | `AdminGuard`; no JWT |
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

`useAuth()` exposes `{ user, token, currentBranchId, login, logout }`. When an OWNER logs in, `currentBranchId` is `null` until they select a branch from the Sidebar. If there is only one branch, it is auto-selected. `currentBranchId` is stored in `sessionStorage` (not persisted across tabs) via `auth.context.tsx`.

### Socket context

`useSocketEvent<T>(event, handler)` subscribes a component to a Socket.IO event. Subscriptions are cleaned up on unmount. The socket connects with `auth: { token }` from JWT.

## Data Model

11 tables, all scoped by `tenant_id`:

```
Tenant ──┬── User (OWNER / CASHIER, optional branchId)
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

### Tenant settings

`Tenant.orderNumberResetPeriod` (DAILY | MONTHLY) controls when `order_number` resets to 1. The SQL uses `DATE()` for daily and `DATE_TRUNC('month', …)` for monthly.

## Shared Package

`packages/shared/src/` exports enums and DTO types. **The backend imports from the compiled `dist/` folder** (via tsconfig paths). Always run `pnpm --filter @pos/shared build` after editing shared types before typechecking the backend.

Key enums: `UserRole`, `OrderType`, `OrderStatus`, `PaymentMethod`, `CashSessionStatus`, `ExpenseCategory`, `OrderNumberResetPeriod`.

## Environment Variables (backend)

```
DATABASE_URL     postgresql://pos_user:pos_password@localhost:5433/pos_db
JWT_SECRET
JWT_EXPIRATION   (default: 7d)
PORT             (default: 3000)
FRONTEND_URL     (default: http://localhost:5173)
ADMIN_SECRET     x-admin-key header value. Dev default: dev-admin-secret
```

## CI/CD

`.github/workflows/deploy.yml` on every push to `main`:

1. **Validate** — `pnpm --filter @pos/shared build`, then `typecheck` backend + frontend.
2. **Build & push** — multi-stage Docker images → GitHub Container Registry (`ghcr.io`).
3. **Deploy** — SSH into VPS, update `IMAGE_TAG`, pull images, `docker-compose -f docker-compose.prod.yml up -d`.

Migrations run automatically on backend container start (`prisma migrate deploy` in entrypoint).

## Production Deployment

`docker-compose.prod.yml`: three services — `postgres`, `backend`, `frontend`/nginx.

- Uploads persist via Docker volume `uploads_data`.
- nginx proxies `/api/`, `/uploads/`, `/socket.io/` to backend; stays on HTTP internally.
- TLS: Cloudflare orange-cloud proxy, SSL/TLS set to "Full".
