# CONTEXT.md — Descripcion de carpetas y contenido del proyecto YankoPOS

Este archivo describe la estructura de carpetas del monorepo y el proposito de cada una.

Repositorio: https://github.com/albertoamas/Restaurant

---

## Raiz del proyecto

```
/
├── backend/              API NestJS (servidor)
├── frontend/             Aplicacion React (cliente)
├── packages/             Paquetes internos del monorepo
│   └── shared/           Tipos TypeScript compartidos (@pos/shared)
├── docs/                 Documentacion interna y guias de despliegue
├── e2e/                  Tests end-to-end con Playwright
├── scripts/              Scripts de mantenimiento (backup de BD)
├── .github/workflows/    Pipeline CI/CD (GitHub Actions)
├── docker-compose.yml    Entorno de desarrollo local (solo PostgreSQL)
├── docker-compose.prod.yml  Produccion completa (postgres + backend + frontend)
├── pnpm-workspace.yaml   Configuracion del monorepo
├── README.md             Instrucciones de instalacion y descripcion general
└── CONTEXT.md            Este archivo
```

---

## backend/

API REST + WebSocket construida con NestJS 11 y Prisma 6.

```
backend/
├── prisma/
│   ├── schema.prisma     Esquema de base de datos (20 tablas)
│   └── migrations/       Migraciones SQL generadas por Prisma
├── src/
│   ├── main.ts           Punto de entrada, configura puerto, prefijo /api/v1 y CORS
│   ├── app.module.ts     Modulo raiz, registra ThrottlerModule (100 req/min global)
│   ├── common/
│   │   ├── decorators/   @CurrentUser(), @CurrentTenant(), @Roles(), @RequiresModule()
│   │   ├── filters/      HttpExceptionFilter: normaliza errores a { statusCode, message }
│   │   ├── guards/       JwtAuthGuard, RolesGuard, ModuleGuard, AdminGuard
│   │   └── utils/        timezone.util.ts (America/La_Paz), otros utilitarios
│   └── modules/
│       ├── admin/        Gestion de tenants por el super-admin (sin JWT, usa x-admin-key)
│       ├── auth/         Login, registro de cajeros, JWT, cambio de contrasena
│       ├── branch/       CRUD de sucursales por tenant
│       ├── cash-session/ Apertura y cierre de caja por sucursal
│       ├── catalog/      Categorias y productos (con imagen)
│       ├── customers/    Clientes, historial de pedidos, seguimiento de tickets
│       ├── events/       Gateway WebSocket (Socket.IO), rooms por tenant y sucursal
│       ├── expenses/     Gastos dentro de una sesion de caja
│       ├── orders/       Pedidos, pagos divididos, transiciones de estado
│       ├── plans/        Planes SaaS (BASICO, PRO, NEGOCIO) y sus limites
│       ├── prisma/       PrismaService compartido por todos los modulos
│       ├── raffles/      Sorteos, tickets automaticos, sorteo con crypto.randomInt()
│       ├── reports/      Reportes diarios y por rango con SQL de agregacion
│       ├── tenant/       Configuracion del tenant (logo, slogan, reset de numeracion)
│       └── upload/       Subida de imagenes (multer, 2 MB, JPG/PNG/WEBP/GIF)
```

Cada modulo sigue arquitectura hexagonal:
- `domain/entities/` — clases de dominio puras, sin decoradores ORM
- `domain/ports/` — interfaces de repositorio (contratos)
- `application/use-cases/` — un caso de uso por operacion de negocio
- `application/dto/` — validacion de entrada con class-validator
- `infrastructure/controllers/` — controladores NestJS
- `infrastructure/persistence/` — implementacion de repositorios con Prisma

---

## frontend/

Aplicacion web SPA construida con React 19, Vite 5 y Tailwind CSS 4.

```
frontend/
├── public/               Archivos estaticos
├── src/
│   ├── main.tsx          Punto de entrada React
│   ├── App.tsx           Rutas principales con React Router 6, AuthProvider, SocketProvider
│   ├── api/              Funciones Axios por recurso (sin estado propio)
│   │   ├── client.ts     Instancia Axios con interceptor JWT y redirect en 401
│   │   ├── orders.api.ts
│   │   ├── products.api.ts
│   │   └── ...
│   ├── components/
│   │   ├── ui/           Componentes reutilizables (Modal, Input, Card, Icon, etc.)
│   │   ├── layout/       AppLayout, Sidebar, Header, BranchSelector, Drawer movil
│   │   ├── pos/          Carrito, grilla de productos, panel de pedido, modales de pago
│   │   ├── orders/       Tabla de pedidos, tarjeta de pedido, modales de edicion y pago
│   │   ├── products/     Formulario de producto con subida de imagen
│   │   ├── expenses/     Formulario de gasto
│   │   ├── raffles/      Creacion de sorteo, participantes, premios, sorteo y ganadores
│   │   ├── report/       Graficas y tablas de reportes
│   │   └── admin/        Panel de administracion (login, gestion de tenants)
│   ├── context/
│   │   ├── auth.context.tsx   Usuario, token JWT, branchId seleccionado (localStorage)
│   │   └── socket.context.tsx Socket.IO con reconexion automatica (5 intentos, 2 s)
│   ├── hooks/            Custom hooks que combinan React Query + WebSocket
│   │   ├── useOrders.ts  Pedidos con polling adaptativo y actualizacion por socket
│   │   ├── useProducts.ts
│   │   ├── useCustomers.ts
│   │   └── ...
│   ├── lib/
│   │   ├── query-client.ts  QueryClient (staleTime: 30 s, retry: 1, no refetch on focus)
│   │   └── query-keys.ts    Claves de cache centralizadas para React Query
│   ├── pages/            Componentes de pagina (uno por ruta)
│   │   ├── PosPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── KitchenPage.tsx
│   │   ├── CashPage.tsx
│   │   ├── ReportPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── RafflesPage.tsx
│   │   ├── ExpensesPage.tsx
│   │   ├── TeamPage.tsx
│   │   ├── BranchesPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── AdminPage.tsx
│   ├── routes/
│   │   ├── PrivateRoute.tsx  Redirige a /login si no hay sesion
│   │   └── OwnerRoute.tsx    Redirige a /pos si el rol no es OWNER
│   ├── store/            Estado global con Zustand 5
│   │   ├── cart.store.ts        Carrito (sin persistencia)
│   │   ├── settings.store.ts    Flags de modulos y preferencias (parcialmente persistido)
│   │   └── cashSession.store.ts Sesion de caja activa
│   ├── styles/
│   │   └── index.css     Variables de tema Tailwind 4 y estilos globales
│   └── utils/
│       ├── api-error.ts  handleApiError(): extrae mensaje de error Axios y llama toast
│       ├── date.ts       today(), formatDate(), elapsed()
│       ├── print.ts      Impresion de ticket de cocina via window.print()
│       ├── order.ts      Helpers de estado de pedido
│       └── timezone.ts   getBoliviaDayBounds() para filtros de fecha en UTC
```

---

## packages/shared/

Paquete interno `@pos/shared`. Compilado a `dist/` con `tsc`. El backend importa desde `dist/`, el frontend importa desde `src/` via Vite.

```
packages/shared/src/
├── index.ts              Re-exporta todo el paquete
├── enums.ts              UserRole, OrderType, OrderStatus, PaymentMethod, CashSessionStatus,
│                         ExpenseCategory, OrderNumberResetPeriod, SaasPlan, SOCKET_EVENTS
├── socket-events.ts      Constantes de eventos WebSocket
├── constants.ts          Constantes globales
└── types/
    ├── auth.types.ts     JwtPayload, UserDto, LoginDto
    ├── branch.types.ts   BranchDto
    ├── cash-session.types.ts  CashSessionDto
    ├── customer.types.ts      CustomerDto
    ├── expense.types.ts       ExpenseDto
    ├── order.types.ts         OrderDto, OrderItemDto, OrderPaymentDto
    ├── plan.types.ts          PlanDto
    ├── product.types.ts       ProductDto, CategoryDto
    └── raffle.types.ts        RaffleDto, RaffleTicketDto, RaffleWinnerDto, RaffleStatus,
                               RaffleTicketMode, RaffleDetailDto
```

Si se edita cualquier archivo en `packages/shared/src/`, es obligatorio ejecutar:

```bash
pnpm --filter @pos/shared build
```

antes de ejecutar typecheck del backend o del frontend.

---

## e2e/

Tests end-to-end con Playwright. Se ejecutan contra la aplicacion en desarrollo (`pnpm dev` corriendo).

```bash
pnpm test:e2e
```

---

## scripts/

```
scripts/
└── backup-db.sh    pg_dump de la BD + tar de uploads hacia /backups/
                    Recomendado en cron: 0 3 * * * /opt/pos/scripts/backup-db.sh
```

---

## docs/

Documentacion interna del proyecto:

```
docs/
├── linked-cuddling-mountain.md     Guia de despliegue inicial en VPS
├── plan-auditoria-360.md           Plan de auditoria pre-venta multi-restaurante
└── cierre-ejecutivo-readiness.md   Checklist de readiness ejecutivo
```

---

## .github/workflows/

```
.github/workflows/
└── deploy.yml    Pipeline CI/CD en GitHub Actions
                  Se activa en cada push a main:
                  1. Validate: build @pos/shared, typecheck backend + frontend
                  2. Build: imagenes Docker multi-stage → GitHub Container Registry (ghcr.io)
                  3. Deploy: SSH al VPS, docker-compose pull + up -d
```

---

## Archivos de configuracion en la raiz

| Archivo | Descripcion |
|---------|-------------|
| `docker-compose.yml` | Solo PostgreSQL para desarrollo local (puerto 5433) |
| `docker-compose.prod.yml` | Produccion: postgres + backend + frontend/nginx, solo expone puerto 80 |
| `pnpm-workspace.yaml` | Define los workspaces del monorepo |
| `package.json` | Scripts globales: `pnpm dev`, `pnpm build`, `pnpm test:*` |
| `playwright.config.ts` | Configuracion de tests E2E |
| `CLAUDE.md` | Instrucciones para el asistente de IA sobre la arquitectura del proyecto |
