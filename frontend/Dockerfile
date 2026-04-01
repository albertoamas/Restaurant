# ── Stage 1: Vite builder ─────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /repo

# Workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY frontend ./frontend

# Build React app — outputs to frontend/dist
RUN pnpm --filter frontend build

# ── Stage 2: nginx static server ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /repo/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
