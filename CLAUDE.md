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
pnpm --filter backend typecheck
cd frontend && npx tsc --noEmit

# Prisma commands
pnpm --filter backend prisma:generate        # Regenerate client after schema changes
pnpm --filter backend prisma:migrate         # Create + apply migration (dev)
pnpm --filter backend prisma:migrate:deploy  # Apply pending migrations (production)
pnpm --filter backend prisma:migrate:status  # Check migration status
pnpm --filter backend prisma:studio          # Visual DB browser on :5555

# Build
pnpm build
```

The Vite dev server proxies `/api`, `/uploads`, and `/socket.io` to `localhost:3000`, so in development the frontend never needs to know the backend URL directly.

**PostgreSQL connection** (docker-compose): host `localhost:5433`, db `pos_db`, user `pos_user`, password `pos_password`.

## Backend Architecture

### Hexagonal (ports & adapters) per module

Every NestJS module under `backend/src/modules/` follows this layout:
```
domain/
  entities/      ← pure TS classes (no ORM decorators), e.g. User.create()
  ports/         ← repository interfaces (IUserRepository)
application/
  use-cases/     ← one class per operation, injected via DI
  dto/           ← class-validator DTOs
infrastructure/
  controllers/   ← NestJS @Controller, calls use-cases
  persistence/   ← Repository impl (uses PrismaService, maps Prisma rows ↔ domain)
```

Repositories are registered with a string token (`'UserRepositoryPort'`) and injected with `@Inject('UserRepositoryPort')` — not with the class directly.

### Multi-tenancy

Shared database / shared schema. Every table has `tenant_id`. The JWT payload carries `{ sub, tenantId, branchId, role }`. Use the `@CurrentTenant()` decorator to extract `tenantId` in controllers; repositories always filter by it.

`@CurrentUser()` returns the full `JwtPayload` interface (defined in `common/decorators/tenant.decorator.ts`).

### Authorization

Three guards in `backend/src/common/guards/`:

- `JwtAuthGuard` — verifies JWT, required on almost all endpoints
- `RolesGuard` + `@Roles(UserRole.OWNER)` — restricts endpoints to owners
- `AdminGuard` — checks `x-admin-key` header against `ADMIN_SECRET` env var; no JWT required; used only on `/admin/*` endpoints

`CASHIER` users have a `branchId` baked into their JWT; `OWNER` users have `branchId: null` and pass it explicitly in the request body/query.

### Rate Limiting

Global rate limit of 100 requests per minute via `ThrottlerModule` (configured in `app.module.ts` with `ttl: 60000, limit: 100`). The `ThrottlerGuard` is registered as a global `APP_GUARD`. Sensitive endpoints (e.g. login) use `@Throttle` to apply stricter limits.

### Real-time (WebSockets)

`EventsModule` exports `EventsService`. Use cases inject it and call `eventsService.emit(tenantId, event, payload)` to broadcast to all sockets in the tenant room. Events: `order.created`, `order.updated`, `cash.opened`, `cash.closed`.

The `EventsGateway` authenticates the socket connection using the JWT from the handshake auth token and joins the socket to a `tenant:{tenantId}` room and a `t:{tenantId}:b:{branchId}` room for branch-scoped events.

### Modules overview

| Module | Responsibility |
|--------|---------------|
| `auth` | Login, create tenant+owner (admin-only), manage cashiers, JWT |
| `tenant` | Tenant CRUD (owner management, `isActive` flag) |
| `branch` | Branch CRUD per tenant |
| `catalog` | Categories + Products CRUD with pagination (`X-Total-Count` header) |
| `orders` | Create order (with price snapshot), list, update status |
| `cash-session` | Open/close cash register sessions per branch |
| `reports` | Daily report aggregation via SQL (no dedicated table) |
| `upload` | Image upload via multer → `backend/uploads/` served as static. 2 MB limit, whitelist: JPG/PNG/WEBP/GIF (validates both MIME and file extension) |
| `events` | Socket.IO gateway + service for real-time broadcasts |
| `expenses` | Expense tracking per cash session; OWNER only; uses `ExpenseCategory` enum |
| `customers` | Customer CRUD with order history and raffle winner tracking |
| `admin` | Super-admin: list/activate/deactivate/create tenants. Uses `AdminGuard`. Admin-created tenants start as `isActive: true`. Endpoints: `GET /admin/tenants`, `POST /admin/tenants`, `PATCH /admin/tenants/:id/toggle` |

### Static files

Uploaded product images land in `backend/uploads/`. They are served at `GET /uploads/<filename>` via `app.useStaticAssets()` in `main.ts`.

## Frontend Architecture

Layered (not hexagonal):
```
api/         ← Axios functions per resource (no state)
hooks/       ← custom hooks: fetch + state (useProducts, useOrders, useBranches…)
store/       ← Zustand global state (cart.store.ts, settings.store.ts)
context/     ← React context (auth.context.tsx, socket.context.tsx)
pages/       ← route-level components, orchestrate hooks + UI
components/  ← presentational UI (ui/, layout/, pos/, orders/)
utils/       ← pure functions (date.ts: today(), formatDate(), elapsed())
routes/      ← PrivateRoute (any authenticated), OwnerRoute (OWNER only)
```

### Route structure

```
/                ← public (LandingPage)
/login           ← public
/admin           ← public (protected only by x-admin-key header on API calls)
/kitchen         ← auth only, fullscreen (no sidebar)
/* (AppLayout) ←
  /pos           ← CASHIER + OWNER
  /orders        ← CASHIER + OWNER
  /cash          ← CASHIER + OWNER
  /report        ← OWNER only
  /expenses      ← OWNER only
  /customers     ← OWNER only
  /products      ← OWNER only
  /team          ← OWNER only
  /branches      ← OWNER only
  /settings      ← OWNER only
```

Unknown routes redirect to `/`. There is no public self-registration — tenants are created by the developer via the `/admin` panel after payment.

### Auth context

`useAuth()` exposes `{ user, token, currentBranchId, login, logout }`. `currentBranchId` is `user.branchId` for cashiers, or a selected branch stored in the owner's session for owners (owners must select a branch to create orders).

### Socket context

`useSocketEvent<T>(event, handler)` subscribes a component to a Socket.IO event. The socket connects with `auth: { token }` from the JWT. Subscriptions are cleaned up on unmount.

## Data Model

10 tables, all scoped by `tenant_id`:

```
Tenant ──┬── User (OWNER / CASHIER, optional branchId)
         ├── Branch
         ├── Category ── Product (price, imageUrl)
         ├── Order ── OrderItem (price snapshot: productName, unitPrice)
         ├── CashSession ── Expense (category, amount, description)
         └── Customer (name, phone, email, isRaffleWinner)
```

Prisma schema: `backend/prisma/schema.prisma`. All string enums (role, status, type) stored as plain strings in DB — validated at the domain layer using `@pos/shared` enums.

## Shared Package

`packages/shared/src/` exports all TypeScript enums and DTO types used on both sides. No build step — consumed directly as TypeScript source via tsconfig paths. When adding a new type that both frontend and backend need, add it here and export from `index.ts`.

Key enums: `UserRole`, `OrderType`, `OrderStatus`, `PaymentMethod`, `CashSessionStatus`, `ExpenseCategory`.

## Environment Variables (backend)

```
DATABASE_URL     (e.g. postgresql://pos_user:pos_password@localhost:5433/pos_db)
JWT_SECRET
JWT_EXPIRATION   (default: 7d)
PORT             (default: 3000)
FRONTEND_URL     (default: http://localhost:5173)
ADMIN_SECRET     secret key for the /admin panel (x-admin-key header). Dev value: dev-admin-secret
```

See `.env.production.example` at the repo root for the production template.

## CI/CD

`.github/workflows/deploy.yml` runs on every push to `main`:

1. **Validate** — installs deps, type-checks backend (`pnpm --filter backend typecheck`) and frontend (`tsc --noEmit`). Fails fast before any Docker work.
2. **Build & push** — builds multi-stage Docker images for backend and frontend, pushes to GitHub Container Registry (`ghcr.io`).
3. **Deploy** — SSHs into the VPS, updates `IMAGE_TAG` in the remote `.env`, pulls new images, runs `docker-compose -f docker-compose.prod.yml up -d`.

Migrations run automatically when the backend container starts (`prisma migrate deploy` in the entrypoint).

## Production Deployment

Uses `docker-compose.prod.yml` (three services: `postgres`, `backend`, `frontend`/nginx).

- Backend uploads persist via a named Docker volume (`uploads_data`).
- Health checks are configured on both postgres and backend.
- nginx (`frontend/nginx.conf`) terminates HTTP and proxies `/api/`, `/uploads/`, `/socket.io/` to the backend. HSTS header is included for when TLS is active upstream (Cloudflare or Certbot).
- Recommended TLS approach: point domain to Cloudflare, enable orange-cloud proxy, set SSL/TLS to "Full". nginx stays on HTTP internally.
