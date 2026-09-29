# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**YankoPOS** — SaaS POS for small food businesses. Live in production.

## Stack

pnpm workspaces monorepo:
- `backend/` — NestJS 11 + Prisma 6 + PostgreSQL
- `frontend/` — React 19 + Vite 6 + Tailwind CSS 4, React Router 6, Zustand 5, TanStack Query 5
- `packages/shared/` — `@pos/shared`: enums, DTO types and `SOCKET_EVENTS` shared by both sides

Socket.IO 4 for real time; JWT via `@nestjs/jwt` + `passport-jwt`.

## Commands

```bash
# First time
pnpm install && docker-compose up -d
pnpm --filter backend prisma:migrate && pnpm --filter backend prisma:generate
pnpm --filter backend seed          # demo data — NEVER in production (well-known credentials)

pnpm dev                            # builds shared, then backend :3000 + frontend :5173
pnpm dev:backend | pnpm dev:frontend

pnpm --filter @pos/shared build     # MUST run first after editing shared types (backend reads dist/)
pnpm --filter backend typecheck
pnpm --filter frontend typecheck
pnpm --filter backend lint          # backend only; zero-warning policy

pnpm test:backend                   # Jest
pnpm test:frontend                  # Vitest
pnpm test:e2e                       # Playwright (starts/reuses the dev stack)
pnpm --filter backend test -- --testPathPattern="create-order"
pnpm --filter frontend test:run -- src/store/cart.store.spec.ts

pnpm --filter backend prisma:migrate:status | prisma:migrate:deploy | prisma:studio
pnpm build
```

Demo login (after seed): `owner@demo.com` / `cajero@demo.com`, password `demo123` — tenant "Restaurante Demo" (PRO).
Postgres (docker-compose): `localhost:5433`, db `pos_db`, user `pos_user`, password `pos_password`.
Vite proxies `/api`, `/uploads`, `/socket.io` to `:3000`.

## Conventions

- Keep changes small and scoped to the requested module — no unsolicited global refactors.
- `any` is an ESLint error; `_` prefix silences unused params.
- Use-case error messages are in **Spanish** — they reach the UI verbatim via `HttpExceptionFilter`.
- The automated suite is not comprehensive: typecheck + manual test of affected screens.
- After `pnpm add`, check `onlyBuiltDependencies` in `pnpm-workspace.yaml` (Prisma, esbuild and
  Sharp need their build scripts).
- Prisma on Windows (migrate lock timeout, generate EPERM, `TEXT` ids in hand-written SQL, the
  AI consent gate on `migrate reset`): see the `prisma-change` skill before touching migrations.

## Backend

Hexagonal modules under `backend/src/modules/<name>/` (`domain/` → `application/` →
`infrastructure/`); repositories injected through a port token, never the concrete class.
Details and test patterns: `nest-module` skill. Reference module: `raffles`.

Global config: prefix `/api/v1` (`GET /health` outside it); `ValidationPipe` with
`whitelist + forbidNonWhitelisted + transform` (an unknown field is a 400); errors normalized to
`{ statusCode, message, error, timestamp }`; `ThrottlerModule` 100 req/min, stricter on login;
CORS open in dev, `FRONTEND_URL` required in prod.

### Multi-tenancy

Shared schema: every table except `Plan` has `tenant_id`, and every repository filters by it.
JWT payload `{ sub, tenantId, branchId, role }`; controllers use `@CurrentTenant()` /
`@CurrentUser()` (`common/decorators/tenant.decorator.ts`).

### Multi-sucursal

El OWNER tiene `branchId: null` y manda la sucursal en body/query, así que **todo caso de uso que
escriba datos de sucursal la valida primero** con `BranchAccessService`
(`modules/branch/application/services/`):

- `assertUsable(branchId, tenantId)` — existe, es del tenant y está activa. Crear pedido, crear
  gasto, abrir caja, asignar cajero.
- `assertBelongsToTenant(branchId, tenantId)` — sin exigir activa. Cerrar caja: debe poder
  hacerse en una sucursal que se está desactivando (`ToggleBranchUseCase` exige caja cerrada y
  ningún cajero activo asignado antes de desactivar).

Un `branchId` sin validar deja pedidos o gastos huérfanos que no aparecen en ningún reporte.

`JwtStrategy` resuelve el `branchId` **desde la BD** (caché 60 s), no del token: reasignar un
cajero surte efecto sin re-login. `ToggleBranchUseCase` lee lo que necesita por `BranchUsagePort`,
propio de `BranchModule` — inyectar los puertos de usuarios o caja crearía una dependencia
circular.

En el frontend, `currentBranchId === null` es la **vista consolidada**: solo válida en pantallas de
lectura (reportes, pedidos, gastos, clientes). POS, caja y cocina exigen una sucursal concreta.

### Authorization (`common/guards/`)

- `JwtAuthGuard` — almost every endpoint.
- `RolesGuard` + `@Roles(UserRole.OWNER)`.
- `ModuleGuard` + `@RequiresModule('<flag>')` — 403 when the tenant's module is off.
- `ReportHistoryGuard` — rejects a `from`/`date` older than `plan.reportHistoryDays`.
- `AdminGuard` — `x-admin-key` vs `ADMIN_SECRET`, no JWT, only `/admin/*` (401 if the secret is unset).

`CommonModule` re-exports `TenantModule` and `PlansModule` because Nest instantiates a guard
referenced by class **inside the controller's module**: if its ports aren't visible there, the
app doesn't boot.

### Real time

Use cases call `EventsService.emitToTenant(tenantId, event, payload)` (or `emit(tenantId, branchId, …)`
for branch-local views). Event names only from `SOCKET_EVENTS` in `@pos/shared` — never string
literals. Rooms: `tenant:{tenantId}`, `t:{tenantId}:b:{branchId}`. Recipe: `realtime-event` skill.

### Module notes (non-obvious rules only — endpoints are in each controller)

- **orders** — price/name snapshot in `OrderItem`; split payments (see below);
  `POST /orders/:id/payments` registers a deferred payment.
- **reports** — raw SQL, OWNER only, whole controller behind `ReportHistoryGuard`. Six endpoints
  (`top-products`, `top-customers`, `by-cashier`, `top-categories`, `by-hour`, `cash-sessions`)
  require `advancedReportsEnabled`; the ones behind Resumen, Ventas and the branch comparison stay
  open. `by-branch` / `by-branch-daily` feed the **Sucursales** tab (shown with >1 branch): no
  `branchId` param, always all branches, same filters as `daily-series` so the totals add up.
  In that tab a branch's color is assigned over the name-sorted full list
  (`utils/branch-series.ts`), never by ranking — changing the period repaints nobody.
- **upload** — multer in memory, 10 MB raw, JPG/PNG/WEBP/GIF → WEBP, stored in
  `uploads/<tenantId>/`. `StorageQuotaService` charges `plan.maxStorageMb` on the **compressed**
  size. Old flat `/uploads/<file>` URLs still served. Files are public — no sensitive uploads.
- **expenses** — OWNER only; `cashSessionId` nullable (an expense can exist without an open
  session); per-tenant `ExpenseCategory` and `ExpenseConcept` models; optional `items[]`.
- **raffles** — requires `rafflesEnabled`; ACTIVE→CLOSED→DRAWING→DRAWN. Ticket modes:
  `PRODUCT_MATCH` (buying a product = ticket) and `SPENDING_THRESHOLD` (every N Bs spent, tracked
  in `CustomerRaffleSpending`). `RaffleAutoTicketService` issues tickets on order create/complete.
- **admin** — `POST /admin/tenants` creates tenant + owner + first branch in one transaction;
  `/admin/tenants/:id/health` is the onboarding checklist (`docs/onboarding-cliente.md`).
- **auth** — `PATCH /auth/me/password` requires the `x-admin-key` header.
- **catalog** — pagination via `X-Total-Count` header.

## Frontend

Layered, not hexagonal: `api/` (Axios, no state) → `hooks/` (TanStack Query + socket
invalidation) → `pages/` / `components/`. Stores in `store/`, auth and socket in `context/`.
Data-layer rules: `frontend-data` skill. Visual rules and the `components/ui` kit:
`ui-conventions` skill.

- `QueryClient` (`lib/query-client.ts`): `staleTime` 30 s, `refetchOnWindowFocus: false`,
  `retry: 1`. The socket is the freshness mechanism; real-time views poll only while it is
  disconnected and invalidate on reconnect. Query keys only from `lib/query-keys.ts`.
- The socket reconnects indefinitely (1 s → 5 s backoff).
- JWT in `localStorage['pos_token']`; a 401 clears it and redirects to `/login`. Selected branch in
  `localStorage['pos_branch']`; an OWNER starts with `null` (auto-selected if there is one branch).
- Server-controlled flags (`kitchenEnabled`, module flags, `orderNumberResetPeriod`) are **not**
  persisted in `settings.store` — `applyModules()` in `auth.context.tsx` sets them on every login/me.
- Every `catch` uses `handleApiError()` (`utils/api-error.ts`).
- Routes: `/` landing, `/login`, `/admin` (x-admin-key), `/kitchen` (fullscreen, no sidebar), and
  inside `AppLayout` the POS/orders/cash screens (CASHIER + OWNER) and the owner-only ones
  (`OwnerRoute`). `/orders`, `/cash`, `/kitchen`, `/team`, `/branches`, `/raffles` are also behind the
  inline `ModuleRoute` in `App.tsx`: a disabled module redirects to `/pos`. Unknown routes → `/`.
  No public sign-up.

### PWA (installable, no offline mode)

`vite-plugin-pwa` (config in `frontend/vite.config.ts`). The service worker precaches only the app
shell; `/api`, `/uploads`, `/socket.io` and `/health` always go to the network and are in
`navigateFallbackDenylist`. There is no offline mode — `OfflineBanner` just explains it.

- **Updates never reload on their own** (`registerType: 'prompt'`): `PwaUpdatePrompt` asks, and
  blocks "Actualizar" while the cart has items — `cart.store` is **in memory only**, a reload
  empties it. `usePwaUpdate` also checks for a new version every hour.
- `usePwaUpdate` is the only importer of `virtual:pwa-register/react` (a no-op stub in `pnpm dev`);
  tests mock that hook, never the virtual module. `beforeinstallprompt` is captured in
  `utils/pwa-install.ts` before the first render (`initPwaInstall()` in `main.tsx`).
- Icons are generated from `public/favicon.svg`: `pnpm --filter frontend pwa:assets`.
- All printing goes through `printDocument()` in `utils/print.ts` (hidden iframe). Never
  `window.open` (breaks in the installed app) nor a `<script>` inside the printed document
  (the CSP blocks it).
- Brand/background colors for non-CSS consumers (manifest, icons, `theme-color`) live in
  `src/theme-colors.ts`.
- **nginx** (`frontend/nginx.conf`): `sw.js`, `index.html` and the manifest are `no-cache`,
  `/assets/` is immutable. Security headers live in `frontend/security-headers.conf` and must be
  `include`d in every `location` that has its own `add_header` (nginx doesn't inherit them).
- The CSP allows the inline theme script in `index.html` by **sha256**: editing that script
  requires updating the hash — `src/index-html.spec.ts` fails and prints the new one.
- **Kill switch**: if a broken service worker ships, set `PWA_KILL_SWITCH = true` in
  `vite.config.ts` and deploy — every client unregisters it and reloads as a plain web app.

## Data model

Schema: `backend/prisma/schema.prisma` (21 models). `Plan` is global; everything else hangs off
`Tenant`: users, branches, `BranchOrderSequence`, catalog, orders (+ items, payments), cash
sessions, expenses (+ items, categories, concepts), customers and raffles (+ prizes, tickets,
winners, spending). Enums are stored as plain strings.

### Split payments

`Order.paymentMethod` keeps the **dominant** method (for display/back-compat); `order_payments`
has one row per partial payment, and `SUM(amount)` must equal `order.total` (±0.01). Reports and
cash-session totals aggregate from `order_payments`, never from `orders.payment_method`.

### Order numbers

`Tenant.orderNumberResetPeriod` (DAILY | MONTHLY) resets `order_number`; sequences are allocated
atomically in `BranchOrderSequence`.

### Planes y módulos

`Tenant.plan` → `Plan` (`BASICO` | `PRO` | `NEGOCIO`): límites (`maxBranches`, `maxCashiers`,
`maxProducts`) y módulos (`kitchenEnabled`, `rafflesEnabled`, `advancedReports`,
`reportHistoryDays`, `maxStorageMb`).

- **`-1 = sin límite`** en todos los numéricos: usá `isUnlimited()` de `@pos/shared`, nunca
  compares contra 999. `UpdatePlanLimitsUseCase` rechaza el 0, y la validación de coherencia
  rechaza un plan intermedio ilimitado cuando el superior tiene tope. Los planes sembrados usan
  topes reales; el único `-1` es el historial de reportes de NEGOCIO.
- Todo lo que el plan vende se aplica en el servidor:

  | Campo | Lo aplica |
  |---|---|
  | `maxBranches` / `maxCashiers` / `maxProducts` | `PlanLimitService` (cuenta **solo filas activas**) |
  | `kitchenEnabled` / `rafflesEnabled` | `ModuleGuard` + `@RequiresModule` |
  | `advancedReports` | `ModuleGuard` en 6 endpoints de `reports` |
  | `reportHistoryDays` | `ReportHistoryGuard` |
  | `maxStorageMb` | `StorageQuotaService` |

  La pestaña **Gastos** de reportes no es avanzada: usa `/expenses/summary`, que está abierto.
- **El plan es la fuente de verdad de los módulos.** `PlanModulesService`
  (`modules/plans/application/`): `efectivo = baseModules(plan) + moduleOverrides`.
  `ordersEnabled`/`cashEnabled` siempre true; `branchesEnabled` = `maxBranches !== 1`;
  `teamEnabled` = `maxCashiers !== 0` (la columna `plans.team_enabled` ya no se lee; se elimina en
  una migración posterior). `Tenant.moduleOverrides` (JSONB) guarda **solo** las excepciones que el
  admin fijó a mano; volver al valor del plan borra la excepción.
- Las 6 columnas booleanas de `tenants` son el **valor efectivo** que leen `ModuleGuard` y
  `GET /auth/me`. Quien cambie plan o módulos recalcula y persiste ambas cosas con
  `applyModules()` — si no, una cortesía concedida a mano se pierde en silencio.
- Bajar de plan no destruye nada: `PATCH /admin/tenants/:id/plan` devuelve `excess[]` y
  `PlanLimitService` bloquea crear más.

### Zona horaria

Todo cálculo de fechas usa `America/La_Paz` (UTC-4) vía `toBoliviaDateString()`
(`backend/src/common/utils/timezone.util.ts`), incluido el reinicio del número de pedido.

**Todo campo `DateTime` lleva `@db.Timestamptz(3)`** (lo verifica
`src/common/schema-timezone.spec.ts`). Con columnas sin zona, el SQL crudo de los reportes
agrupaba por día UTC y comparaba con 4 h de corrimiento — el bug de marzo a septiembre de 2026
(`docs/analisis-zona-horaria.md`).

## Shared package

`packages/shared/src/` exports enums, DTO types and `SOCKET_EVENTS`; new contracts must be
exported from its `index.ts`. The backend compiles against `dist/`, the frontend against `src/`.
Raffle types (`RaffleStatus`, `RaffleTicketMode`) are string-literal unions, not enums. The
`ExpenseCategory` enum is legacy (kept for the `Expense.category` string); real categories are the
DB model.

## Environment & deploy

- Templates: `backend/.env.example` (dev) and `.env.production.example` (VPS). Required in prod:
  `JWT_SECRET`, `ADMIN_SECRET`, `FRONTEND_URL`, `DATABASE_URL`. `TZ=America/La_Paz` is set on the
  containers.
- CI (`ci.yml`, PRs and non-main branches): shared build → typecheck + lint.
- CD (`cd.yml`, push to `main`): validate → build images to `ghcr.io/albertoamas/restaurant` →
  SSH deploy to the VPS with `docker-compose.prod.yml`. Migrations run on backend container start
  (`prisma migrate deploy`), so every migration must be safe to run unattended.
- Production: `postgres`, `backend`, `frontend` (nginx: serves the SPA and proxies `/api/`,
  `/uploads/`, `/socket.io/`), `prometheus`, `postgres-exporter`. Metrics go to Grafana Cloud
  (credentials are GitHub secrets injected into `prometheus/prometheus.yml`). TLS by Cloudflare
  proxy ("Full"); its Browser Cache TTL must stay on "Respect Existing Headers" or it can
  override the `no-cache` on `sw.js`. Uploads live in the `uploads_data` volume; backups via `scripts/backup-db.sh`.

## Reference docs

- `docs/onboarding-cliente.md` — onboarding a new tenant
- `docs/analisis-zona-horaria.md` — timezone bug diagnosis
- `docs/plan-escalado-multisucursal-multitenant-planes.md` — multi-branch / multi-tenant / plans audit
- `docs/gastos-hardening-plan.md` — expenses hardening plan
- `docs/reports-charts-plan/` — reports screen, per tab

## Skills

Project skills (`.claude/skills/`, source of truth): `nest-module`, `prisma-change`,
`realtime-event`, `frontend-data`, `ui-conventions`, `e2e-test`, `verify`. `.agents/skills/` mirrors
them for Codex / Gemini CLI / Copilot — after editing one, `cp -r .claude/skills/. .agents/skills/`.

Third-party skills are installed with the official CLI and pinned in `skills-lock.json`; never
edit their files: `npx skills update -p`, `npx skills add <owner/repo> --skill <name> -a claude-code`,
`npx skills remove <name>`. The project is on Prisma 6 — skip Prisma skills for v7/v8 (`prisma-cli`).
