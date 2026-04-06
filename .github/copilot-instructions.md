# Project Guidelines

## Code Style
- Mantener cambios pequenos y acotados al modulo solicitado; evitar refactors globales no pedidos.
- En backend, preservar arquitectura hexagonal por modulo: `domain`, `application`, `infrastructure`.
- En frontend, respetar capas actuales: `api`, `hooks`, `store`, `context`, `pages`, `components`.
- Tipar todo en TypeScript y evitar `any` salvo casos justificados.

## Architecture
- Monorepo pnpm con 3 paquetes: `backend` (NestJS + Prisma), `frontend` (React + Vite), `@pos/shared` (tipos/enums compartidos).
- Multi-tenant obligatorio: toda logica de datos debe filtrar por `tenantId`.
- Reglas de sucursal: `CASHIER` usa `branchId` del JWT; `OWNER` suele enviarlo en body/query.
- Inyeccion backend por puertos con string tokens (ejemplo: `'OrderRepositoryPort'`), no acoplar casos de uso a implementaciones concretas.
- Eventos en tiempo real via `EventsService` y rooms por tenant/sucursal.

## Build and Test
- Instalar dependencias: `pnpm install`
- Desarrollo completo: `pnpm dev`
- Backend solo: `pnpm dev:backend`
- Frontend solo: `pnpm dev:frontend`
- Build: `pnpm build`
- Typecheck backend (gate principal): `pnpm --filter backend typecheck`
- Typecheck frontend (gate principal): `pnpm --filter frontend typecheck`
- Prisma al cambiar schema: `pnpm --filter backend prisma:generate`
- Migraciones dev: `pnpm --filter backend prisma:migrate`
- Seed demo: `pnpm --filter backend seed`
- Antes de ejecutar backend local, asegurar PostgreSQL levantado con `docker-compose up -d`.

## Conventions
- No existe suite de tests automatizados establecida; validar cambios con typecheck y pruebas manuales de flujos afectados.
- Si se toca `packages/shared`, compilar shared antes de validar backend/frontend: `pnpm --filter @pos/shared build`.
- Mantener contratos compartidos en `packages/shared/src` y exportarlos en su `index.ts`.
- En endpoints protegidos, usar decoradores y guards existentes (`@CurrentTenant`, `@CurrentUser`, `@Roles`, `JwtAuthGuard`, `RolesGuard`, `AdminGuard`).
- En produccion, no asumir defaults de seguridad: `FRONTEND_URL`, `JWT_SECRET` y `ADMIN_SECRET` deben existir.

## Reference Docs
- Arquitectura, modulos y comandos extendidos: ver `CLAUDE.md`.
- Pipeline de build/deploy: ver `.github/workflows/deploy.yml`.
- Pasos operativos de despliegue inicial VPS: ver `docs/linked-cuddling-mountain.md`.
- Plan de auditoria pre-venta multi-restaurante: ver `docs/plan-auditoria-360.md`.