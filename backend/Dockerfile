# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /repo

# Copy workspace manifests + prisma schema first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/shared/package.json ./packages/shared/
COPY backend/prisma ./backend/prisma

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build shared package first so @pos/shared resolves to compiled JS/d.ts
RUN pnpm --filter @pos/shared build

# Generate Prisma client (needed for nest build)
RUN cd /repo/backend && pnpm run prisma:generate

# Compile NestJS — imports @pos/shared from packages/shared/dist
RUN pnpm --filter backend build

# ── Stage 2: production runner ────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9 --activate

# Install production deps only
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/
COPY backend/prisma ./backend/prisma
RUN pnpm install --frozen-lockfile --prod

# Copy compiled shared package so require('@pos/shared') resolves at runtime
COPY --from=builder /repo/packages/shared/dist /app/packages/shared/dist

# Copy compiled output from builder
WORKDIR /app/backend
COPY --from=builder /repo/backend/dist ./dist
COPY --from=builder /repo/backend/prisma ./prisma

# Generate Prisma client for the runner platform (linux/alpine binary)
RUN cd /app/backend && pnpm run prisma:generate

# Seed initial uploads — Docker volume initializes from image on first run
COPY --chown=node:node backend/uploads ./uploads

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Apply pending migrations then start the server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
