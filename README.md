# POS SaaS — Sistema de Punto de Venta para Restaurantes y Locales

Plataforma multi-tenant de punto de venta diseñada para restaurantes, cafeterías, hamburgueserías y cualquier negocio de comida. Cada local tiene su propio entorno aislado. Gestiona pedidos, caja, reportes, productos, clientes y sorteos — todo en tiempo real, desde cualquier dispositivo.

---

## Características principales

### Punto de Venta (POS)
- Toma de pedidos por mesa (dine-in), para llevar y delivery
- Carrito persistente entre sesiones con Zustand + localStorage
- Pagos divididos (múltiples métodos en un mismo pedido: efectivo, QR, tarjeta, cortesía)
- Impresión automática de ticket de cocina vía navegador
- Asignación de cliente al pedido para historial y sorteos

### Cocina
- Pantalla fullscreen dedicada (`/kitchen`) con actualización en tiempo real vía WebSocket
- Visualización de pedidos por estado: pendiente → preparando → entregado

### Caja
- Apertura y cierre de sesión de caja por sucursal
- Monto de cierre precargado con desglose esperado (efectivo, QR, tarjeta)
- Registro de gastos por sesión (categorías: insumos, servicios, mantenimiento, etc.)
- Prevención de doble apertura concurrente mediante índice único parcial en DB

### Reportes
- Reporte diario y por rango de fechas
- Top productos más vendidos
- Totales por método de pago
- Clientes más frecuentes

### Clientes
- Registro con nombre, teléfono y correo
- Historial de pedidos por cliente
- Seguimiento de tickets de sorteo

### Sorteos
- **Por producto**: comprar un producto específico = 1 ticket automático
- **Por monto acumulado**: acumular N Bs en cualquier compra = 1 ticket. La acumulación es por sorteo (reinicia con cada sorteo nuevo)
- Múltiples ganadores con posiciones (1°, 2°, 3°, etc.)
- Animación de sorteo con ruleta de nombres
- Anulación de ganadores con re-sorteo automático
- Vista de progreso por cliente: barra de acumulación y tickets ganados

### Gestión (solo OWNER)
- Alta y baja de productos con imagen, categoría y precio
- Gestión de sucursales
- Gestión del equipo (cajeros por sucursal)
- Configuración de numeración de pedidos (reinicio diario o mensual)
- Personalización: logo, dirección, teléfono, slogan del ticket

### Panel de Administración (`/admin`)
- Gestión de tenants (negocios)
- Asignación de plan (BASICO / PRO / NEGOCIO)
- Activación/desactivación de módulos por tenant
- Protegido por `x-admin-key`, sin JWT

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | NestJS 11, Prisma 6, PostgreSQL 15 |
| Frontend | React 19, Vite 5, Tailwind CSS 4 |
| Tiempo real | Socket.IO 4 |
| Auth | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Tipos compartidos | `@pos/shared` (paquete interno del monorepo) |
| Tests backend | Jest + `jest-mock-extended` (173 tests) |
| Tests frontend | Vitest (33 tests) |
| E2E | Playwright (9 tests) |
| Monorepo | pnpm workspaces |
| Deploy | Docker + GitHub Actions → VPS |

---

## Requisitos

- Node.js ≥ 18
- pnpm ≥ 8
- Docker Desktop (para PostgreSQL local)

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar la base de datos
docker-compose up -d

# 3. Crear tablas y aplicar migraciones
pnpm --filter backend prisma:migrate

# 4. Generar cliente Prisma
pnpm --filter backend prisma:generate

# 5. Poblar con datos de demo
pnpm --filter backend seed

# 6. Arrancar backend + frontend en paralelo
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Prisma Studio (DB browser): `pnpm --filter backend prisma:studio` → http://localhost:5555

### Credenciales de demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| OWNER | owner@demo.com | demo123 |
| CASHIER | cajero@demo.com | demo123 |

Tenant de demo: **Restaurante Demo** · Plan: PRO · Sucursal: Principal

> ⚠️ Nunca ejecutes `seed` en producción. Crea un tenant de ejemplo con credenciales conocidas.

---

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y ajusta:

```env
DATABASE_URL=postgresql://pos_user:pos_password@localhost:5433/pos_db
JWT_SECRET=<genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRATION=24h
PORT=3000
FRONTEND_URL=http://localhost:5173
ADMIN_SECRET=dev-admin-secret
NODE_ENV=development
```

---

## Comandos útiles

```bash
# Desarrollo
pnpm dev                    # backend + frontend simultáneo
pnpm dev:backend            # solo NestJS en :3000
pnpm dev:frontend           # solo Vite en :5173

# Shared types (obligatorio antes de typecheck si se modificó @pos/shared)
pnpm --filter @pos/shared build

# Typecheck
pnpm --filter backend typecheck
pnpm --filter frontend typecheck

# Tests
pnpm --filter backend test                                            # todos
pnpm --filter backend test -- --testPathPattern="create-order"       # uno específico
pnpm --filter frontend test:run                                       # todos
pnpm --filter frontend test:run -- src/store/cart.store.spec.ts      # uno específico

# Prisma
pnpm --filter backend prisma:migrate         # nueva migración en dev
pnpm --filter backend prisma:generate        # regenerar cliente (parar backend antes en Windows)
pnpm --filter backend prisma:migrate:status  # ver estado de migraciones

# Build de producción
pnpm build
```

---

## Arquitectura

### Monorepo

```
/
├── backend/          NestJS API
├── frontend/         React SPA
├── packages/shared/  Tipos TypeScript compartidos (@pos/shared)
└── docker-compose.yml
```

### Backend — Hexagonal por módulo

Cada módulo en `backend/src/modules/` sigue la misma estructura:

```
domain/
  entities/    Clases puras de dominio (sin decoradores ORM)
  ports/       Interfaces de repositorio (contratos)
application/
  use-cases/   Un caso de uso por operación
  dto/         Validación de entrada con class-validator
infrastructure/
  controllers/ @Controller NestJS, llama a use-cases
  persistence/ Implementación de repositorio con Prisma
```

Los repositorios se registran con token string (`'OrderRepositoryPort'`) y se inyectan con `@Inject(...)`, nunca directamente por clase.

### Multi-tenancy

Base de datos compartida, esquema compartido. Todas las tablas tienen `tenant_id`. El JWT incluye `{ sub, tenantId, branchId, role }`. Los repositorios siempre filtran por `tenantId`.

Los cajeros tienen `branchId` en el JWT. Los owners tienen `branchId: null` y lo pasan en el request.

### Frontend — Capas

```
api/        Funciones Axios por recurso (sin estado)
hooks/      Custom hooks: fetch + estado local
store/      Zustand: cart, settings, cashSession
context/    auth.context.tsx, socket.context.tsx
pages/      Componentes de ruta
components/ ui/, pos/, orders/, raffles/, ...
utils/      date, api-error, print, order
```

El Vite dev server hace proxy de `/api`, `/uploads` y `/socket.io` a `localhost:3000`.

### Tiempo real

`EventsService.emitToTenant(tenantId, event, payload)` difunde a todos los sockets del tenant. El frontend usa `useSocketEvent<T>(event, handler)` para suscribirse. Eventos: `order.created`, `order.updated`, `cash.opened`, `cash.closed`.

---

## Modelo de datos (resumen)

```
Plan (global)
└── Tenant
    ├── User (OWNER | CASHIER)
    ├── Branch
    ├── Category → Product
    ├── Order → OrderItem, OrderPayment
    ├── CashSession → Expense
    ├── Customer
    └── Raffle
        ├── RafflePrize
        ├── RaffleTicket
        ├── RaffleWinner
        └── CustomerRaffleSpending  (acumulado por cliente, modo SPENDING_THRESHOLD)
```

### Pagos divididos

`Order.paymentMethod` guarda el método dominante (mayor monto). La tabla `order_payments` almacena cada pago parcial. Los reportes agregan desde `order_payments`, no desde `orders.payment_method`.

### Planes SaaS

Tres planes: `BASICO`, `PRO`, `NEGOCIO`. Cada plan define límites (`maxBranches`, `maxCashiers`, `maxProducts`) y flags de módulos (`kitchenEnabled`, `rafflesEnabled`). Los flags por tenant anulan los del plan y los aplica únicamente el admin.

---

## Despliegue en producción

El pipeline CI/CD (`deploy.yml`) se dispara en cada push a `main`:

1. **Validate**: build de `@pos/shared` → typecheck backend + frontend
2. **Build & push**: imágenes Docker multi-stage → GitHub Container Registry
3. **Deploy**: SSH al VPS, `docker-compose -f docker-compose.prod.yml up -d`

Las migraciones se aplican automáticamente al iniciar el contenedor (`prisma migrate deploy`).

```bash
# Backup manual en el VPS
./scripts/backup-db.sh   # pg_dump + tar de uploads → /backups/
# Cron recomendado: 0 3 * * * /opt/pos/scripts/backup-db.sh
```

TLS mediante Cloudflare (modo "Full"). Los uploads (`/uploads/<uuid>.<ext>`) son públicamente accesibles — úsalos solo para imágenes de productos y logos.

---

## Gotchas en Windows (desarrollo)

- **`prisma migrate dev` se cuelga**: aplica el SQL manualmente con `docker exec pos-postgres psql -U pos_user -d pos_db -c "..."` y registra con `npx prisma migrate resolve --applied <name>` desde `backend/`.
- **`prisma generate` da EPERM**: el binario está bloqueado mientras el backend corre. Para el backend, genera y reinicia.
- **pnpm hoisting**: después de `pnpm add`, verifica que `@prisma/engines`, `@prisma/client` y `prisma` sigan en `onlyBuiltDependencies` en `backend/package.json`.
