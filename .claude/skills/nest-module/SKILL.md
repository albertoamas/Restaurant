---
name: nest-module
description: Conventions for writing backend code in this repo — NestJS 11 hexagonal modules, use cases, ports/repositories, DTOs, controllers, guards and unit tests. Use whenever adding or changing a backend endpoint, use case, repository or NestJS module under backend/src/modules/.
paths: backend/**
---

# Backend module conventions (hexagonal NestJS)

Reference implementation: `backend/src/modules/raffles/` (newest module, follows every rule below).

## Layout

```
backend/src/modules/<name>/
  domain/
    entities/      pure TS classes, no Prisma/Nest decorators. Static factory `X.create({...})`,
                   behaviour as methods (`raffle.close()`), invariants enforced inside.
    ports/         repository interface + exported token constant
  application/
    use-cases/     one class per operation, `execute(...)`, @Injectable()
    dto/           class-validator DTOs (request shape only)
    services/      only for cross-use-case logic (e.g. RaffleAutoTicketService)
  infrastructure/
    controllers/   thin @Controller — no business logic, just calls a use case
    persistence/   repository impl on PrismaService, maps rows ↔ domain entities
  <name>.module.ts
```

## Rules

1. **Port token.** Export a constant from the port file and bind it in the module:
   ```ts
   // domain/ports/raffle-repository.port.ts
   export const RAFFLE_REPOSITORY_PORT = 'RaffleRepositoryPort';
   export interface RaffleRepositoryPort { ... }
   ```
   ```ts
   providers: [{ provide: RAFFLE_REPOSITORY_PORT, useClass: RaffleRepository }, ...useCases]
   ```
   Inject with `@Inject(RAFFLE_REPOSITORY_PORT) private readonly repo: RaffleRepositoryPort`.
   Never inject the concrete repository class. (Older modules use plain string tokens like
   `'OrderRepositoryPort'` — leave them, but use the constant form for anything new.)

2. **One use case per operation.** Constructor takes the port + optional collaborators.
   `EventsService` is injected as `@Optional() private readonly eventsService?: EventsService`
   so unit tests can construct the use case with only the repo mock.

3. **Tenant isolation is not optional.** Every use case takes `tenantId` and every repository
   query filters by it. Controllers get it from `@CurrentTenant()`; the full JWT payload comes
   from `@CurrentUser()` (`common/decorators/tenant.decorator.ts`).
   CASHIER has `branchId` in the JWT; OWNER has `branchId: null` and sends it in body/query.

4. **Error messages in Spanish**, thrown as Nest exceptions — they reach the UI verbatim through
   `HttpExceptionFilter`:
   ```ts
   if (!raffle) throw new NotFoundException(`Sorteo ${id} no encontrado`);
   if (!raffle.isActive) throw new BadRequestException('Solo se pueden cerrar sorteos en estado ACTIVO');
   ```

5. **Guards on the controller**, stacked in this order:
   ```ts
   @Controller('raffles')
   @UseGuards(JwtAuthGuard, ModuleGuard, RolesGuard)
   @RequiresModule('rafflesEnabled')
   @Roles(UserRole.OWNER)
   ```
   Drop `ModuleGuard`/`@RequiresModule` when the feature has no module flag.
   `AdminGuard` (x-admin-key, no JWT) is only for `/admin/*`.

6. **DTOs** use class-validator. The global ValidationPipe runs with
   `whitelist + forbidNonWhitelisted + transform`, so an unknown field makes the request 400 —
   add the property to the DTO, don't work around it.

7. **Shared types** live in `packages/shared`. After editing them run
   `pnpm --filter @pos/shared build` before typechecking the backend (backend resolves `dist/`).

8. **Emitting events**: see the `realtime-event` skill.

9. **Plan limits**: injecting `PlanLimitService` is how branches/cashiers/products enforce
   `maxBranches` / `maxCashiers` / `maxProducts`. Check the limit before creating.

## Unit tests

Spec lives next to the file (`close-raffle.use-case.spec.ts`). Never boot Nest or Prisma.

```ts
import { mock, MockProxy } from 'jest-mock-extended';

let repo: MockProxy<RaffleRepositoryPort>;
beforeEach(() => {
  repo    = mock<RaffleRepositoryPort>();
  useCase = new CloseRaffleUseCase(repo);   // EventsService omitted (@Optional)
});

it('lanza NotFoundException si no existe el sorteo', async () => {
  repo.findRaffleById.mockResolvedValue(null);
  await expect(useCase.execute('r1', 'tenant-1')).rejects.toThrow(NotFoundException);
  expect(repo.saveRaffle).not.toHaveBeenCalled();
});
```

Cover: happy path, each invariant/guard clause, and tenant mismatch. Test names in Spanish,
matching the existing specs.

## Before handing back

`pnpm --filter @pos/shared build && pnpm --filter backend typecheck && pnpm --filter backend lint`
(`lint` is zero-warning; `any` is an error — `_` prefix silences unused params.)
