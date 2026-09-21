---
name: prisma-change
description: Safe workflow for changing the Prisma schema and creating/applying migrations in this repo, including the Windows advisory-lock and EPERM workarounds and the production deploy path. Use whenever backend/prisma/schema.prisma changes or a migration must be created, applied or repaired.
paths: backend/prisma/**
---

# Prisma schema & migration workflow

This app is **live in production**. Migrations run automatically on backend container start
(`prisma migrate deploy` in the entrypoint), so a migration that cannot run unattended breaks a deploy.

## Rules for the schema

- Every table except `Plan` carries `tenant_id`. New models get it, plus an index that leads with it.
- Enums are stored as plain strings in the DB. Keep the TS union/enum in `packages/shared` in sync.
- Money columns follow the existing Decimal usage — match neighbouring fields, don't introduce floats.
- Dates: never compute day boundaries with raw `new Date()`. Use
  `toBoliviaDateString()` in `backend/src/common/utils/timezone.util.ts` (`America/La_Paz`).
- **Every id is `String @id @default(uuid())` — no model uses `@db.Uuid`.** That means every `id`,
  every `tenantId`/`tenant_id`, and every foreign key column is Postgres `TEXT`, not native `UUID`.
  This only bites when you hand-write `migration.sql` instead of letting `prisma migrate dev`
  generate it from a schema diff: writing a new table's FK column as `UUID` fails with
  `foreign key constraint ... cannot be implemented: incompatible types: uuid and text` the moment
  Prisma tries to apply it. Before typing a column type by hand, grep an existing migration for the
  same column (e.g. `grep -A2 'CREATE TABLE "expense_categories"' backend/prisma/migrations/*/migration.sql`)
  instead of assuming.

## Expand / contract — never a destructive single step

Because old and new backend containers overlap during a deploy:

1. **Expand**: add the column as nullable (or with a default), deploy, backfill.
2. **Migrate** the reading/writing code.
3. **Contract**: only in a later migration make it `NOT NULL` or drop the old column.

Renaming a column in one migration, or adding `NOT NULL` without a default to a populated table,
will fail on the production data set. Write the backfill `UPDATE` into the migration SQL.

## Local workflow

```bash
docker-compose up -d                                  # postgres on :5433
pnpm --filter backend prisma:migrate                  # prisma migrate dev — creates + applies
pnpm --filter backend prisma:generate                 # regenerate the client
pnpm --filter backend typecheck
```

Then update the repository mappers (rows ↔ domain entities) and the shared DTOs.

## Windows gotchas

**`prisma migrate dev` hangs on the advisory lock.** Apply the SQL by hand, then register it:

```bash
docker exec pos-postgres psql -U pos_user -d pos_db -c "ALTER TABLE ..."
# from backend/
npx prisma migrate resolve --applied <migration_folder_name>
```

Still create the `backend/prisma/migrations/<timestamp>_<name>/migration.sql` file with the exact
SQL — production replays it.

**`prisma generate` fails with EPERM.** The binary is locked by the running backend. Stop
`pnpm dev:backend`, generate, restart.

**A migration applied with a bad column type leaves `_prisma_migrations` in a failed state**
(`finished_at` is null) and blocks every later migration. Postgres DDL runs as one transaction, so
no partial table survives — but the failed row does. Fix the SQL, then:

```bash
# from backend/
npx prisma migrate resolve --rolled-back <migration_folder_name>
npx prisma migrate dev
```

If the checksum of the migration file changed after Prisma already recorded it (this counts even
for a failed/rolled-back row), `migrate dev` may refuse and ask for a full `migrate reset` to
reconcile history — see the consent gate below before running that.

## The AI-agent consent gate on destructive commands

Prisma detects when `migrate reset` (or another data-destroying command) is invoked by an AI agent
and refuses outright:

> "Prisma Migrate detected that it was invoked by Claude Code... you are forbidden from performing
> this action without explicit consent and review by the user."

It requires `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` set to the user's literal consent text.
Never set that variable pre-emptively or reuse consent from earlier in the conversation — ask again,
in that turn, stating: the exact command, why it's needed, that it irreversibly destroys all data,
that it must never target production, and which database it will actually run against (check
`DATABASE_URL` / which container). Only run it after an explicit, unambiguous yes.

## Verifying

```bash
pnpm --filter backend prisma:migrate:status     # no pending / no drift
pnpm --filter backend prisma:studio             # visual check on :5555
```

Never run `pnpm --filter backend seed` against anything but a local DB — it creates a demo tenant
with published credentials.

## Production

`prisma:migrate:deploy` is what runs in the container entrypoint on every release. Before merging:
re-read the generated SQL, confirm it is idempotent-safe to run once on a populated DB, and that a
rollback path exists (a follow-up migration, not `migrate reset`).
