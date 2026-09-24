/**
 * Seed script — tenant de demostración genérico
 * Uso: pnpm --filter backend seed
 *
 * Credenciales:
 *   OWNER:   owner@demo.com  / demo123
 *   CASHIER: cajero@demo.com / demo123
 *   Negocio: Restaurante Demo (plan PRO, 1 sucursal)
 */

import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { BOLIVIA_OFFSET, OrderStatus, OrderType, PaymentMethod } from '@pos/shared';
import { toBoliviaDateString } from './common/utils/timezone.util';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const prisma = new PrismaClient();

// bcrypt hash de "demo123" con salt 10
const PASSWORD_HASH = '$2b$10$8oTvGty7u4u2obh4a0r9Leq529hbsloH60MXuIlDy6zQEvRwAiVTu';

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ABORTADO: seed no puede ejecutarse en NODE_ENV=production');
    process.exit(1);
  }

  console.log('Conectado a la base de datos');

  // Reset — borrar tenant cascadea a todas las tablas relacionadas
  console.log('Limpiando datos anteriores...');
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  // ── Planes globales ──────────────────────────────────────────────────────────
  console.log('Creando planes...');
  await prisma.plan.createMany({
    data: [
      {
        id:             'BASICO',
        displayName:    'Básico',
        priceBs:        220,
        maxBranches:    1,
        maxCashiers:    2,
        maxProducts:    80,
        kitchenEnabled: false,
        rafflesEnabled: false,
        teamEnabled:       false,
        advancedReports:   false,
        reportHistoryDays: 90,
        maxStorageMb:      100,
      },
      {
        id:             'PRO',
        displayName:    'Pro',
        priceBs:        399,
        maxBranches:    3,
        maxCashiers:    8,
        maxProducts:    -1,
        kitchenEnabled: true,
        rafflesEnabled: true,
        teamEnabled:       true,
        advancedReports:   true,
        reportHistoryDays: 365,
        maxStorageMb:      1024,
      },
      {
        id:             'NEGOCIO',
        displayName:    'Negocio',
        priceBs:        790,
        maxBranches:    -1,
        maxCashiers:    -1,
        maxProducts:    -1,
        kitchenEnabled: true,
        rafflesEnabled: true,
        teamEnabled:       true,
        advancedReports:   true,
        reportHistoryDays: -1,
        maxStorageMb:      5120,
      },
    ],
  });

  // ── Tenant demo ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name:                   'Restaurante Demo',
      slug:                   'demo',
      plan:                   'PRO',
      orderNumberResetPeriod: 'DAILY',
      // Todos los módulos habilitados para que el demo muestre todas las funciones
      ordersEnabled:          true,
      cashEnabled:            true,
      teamEnabled:            true,
      branchesEnabled:        true,
      kitchenEnabled:         true,
      rafflesEnabled:         true,
    },
  });
  console.log(`Tenant creado: ${tenant.name} (${tenant.id})`);

  // ── Sucursal ─────────────────────────────────────────────────────────────────
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name:     'Principal',
    },
  });
  console.log(`Sucursal creada: ${branch.name}`);

  // ── Usuarios ─────────────────────────────────────────────────────────────────
  const ownerUser = await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      email:        'owner@demo.com',
      passwordHash: PASSWORD_HASH,
      name:         'Administrador',
      role:         'OWNER',
    },
  });

  const cashierUser = await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      branchId:     branch.id,
      email:        'cajero@demo.com',
      passwordHash: PASSWORD_HASH,
      name:         'Cajero',
      role:         'CASHIER',
    },
  });
  console.log('Usuarios creados: owner@demo.com, cajero@demo.com');

  // ── Categorías ───────────────────────────────────────────────────────────────
  const categoryNames = [
    { name: 'Platos principales', sortOrder: 1 },
    { name: 'Entradas',           sortOrder: 2 },
    { name: 'Bebidas',            sortOrder: 3 },
    { name: 'Postres',            sortOrder: 4 },
    { name: 'Extras',             sortOrder: 5 },
  ];

  const catId: Record<string, string> = {};
  for (const cat of categoryNames) {
    const created = await prisma.category.create({
      data: { tenantId: tenant.id, name: cat.name, sortOrder: cat.sortOrder },
    });
    catId[cat.name] = created.id;
  }
  console.log(`Categorías creadas: ${categoryNames.map((c) => c.name).join(', ')}`);

  // ── Categorías de gastos ──────────────────────────────────────────────────────
  const expenseCats = [
    { name: 'Gaseosas',        trackQuantity: true,  sortOrder: 10 },
    { name: 'Refrescos',       trackQuantity: true,  sortOrder: 20 },
    { name: 'Operativos',      trackQuantity: false, sortOrder: 30 },
    { name: 'Administrativos', trackQuantity: false, sortOrder: 40 },
    { name: 'Insumos',         trackQuantity: false, sortOrder: 5  },
    { name: 'Personal',        trackQuantity: false, sortOrder: 15 },
    { name: 'Servicios',       trackQuantity: false, sortOrder: 25 },
    { name: 'Transporte',      trackQuantity: false, sortOrder: 35 },
    { name: 'Mantenimiento',   trackQuantity: false, sortOrder: 45 },
    { name: 'Otro',            trackQuantity: false, sortOrder: 99 },
  ];
  const expenseCatId: Record<string, string> = {};
  for (const ec of expenseCats) {
    const created = await prisma.expenseCategory.create({
      data: { tenantId: tenant.id, name: ec.name, trackQuantity: ec.trackQuantity, sortOrder: ec.sortOrder },
    });
    expenseCatId[ec.name] = created.id;
  }
  console.log(`Categorías de gastos creadas: ${expenseCats.map((c) => c.name).join(', ')}`);

  // ── Productos ────────────────────────────────────────────────────────────────
  const products = [
    // Platos principales
    { cat: 'Platos principales', name: 'Pollo a la plancha',   price: 55 },
    { cat: 'Platos principales', name: 'Milanesa de res',      price: 50 },
    { cat: 'Platos principales', name: 'Pasta al pesto',       price: 45 },
    { cat: 'Platos principales', name: 'Hamburguesa clásica',  price: 42 },

    // Entradas
    { cat: 'Entradas', name: 'Ensalada mixta', price: 22 },
    { cat: 'Entradas', name: 'Sopa del día',   price: 18 },

    // Bebidas
    { cat: 'Bebidas', name: 'Agua mineral',    price:  8 },
    { cat: 'Bebidas', name: 'Refresco',        price: 12 },
    { cat: 'Bebidas', name: 'Jugo natural',    price: 15 },
    { cat: 'Bebidas', name: 'Cerveza',         price: 20 },

    // Postres
    { cat: 'Postres', name: 'Helado 2 bochas', price: 15 },
    { cat: 'Postres', name: 'Torta del día',   price: 18 },

    // Extras
    { cat: 'Extras', name: 'Porción de papas', price: 12 },
    { cat: 'Extras', name: 'Salsa adicional',  price:  4 },
    { cat: 'Extras', name: 'Pan adicional',    price:  5 },
  ];

  // Los ids se generan acá para poder usarlos abajo sin releer: `createMany` no
  // devuelve filas en Postgres, y un insert por producto serializaba 15 viajes.
  const createdProducts = products.map((p) => ({
    id:    randomUUID(),
    name:  p.name,
    price: p.price,
    cat:   p.cat,
  }));
  await prisma.product.createMany({
    data: createdProducts.map((p) => ({
      id:         p.id,
      tenantId:   tenant.id,
      categoryId: catId[p.cat],
      name:       p.name,
      price:      p.price,
    })),
  });
  console.log(`Productos creados: ${products.length}`);

  // ── Clientes ─────────────────────────────────────────────────────────────────
  const customerDefs = [
    { name: 'Ana Flores',      phone: '70011122' },
    { name: 'Carlos Mamani',   phone: '70022233' },
    { name: 'Lucía Vargas',    phone: '70033344' },
    { name: 'Jorge Quispe',    phone: '70044455' },
    { name: 'María Rojas',     phone: '70055566' },
    { name: 'Diego Fernández', phone: '70066677' },
    { name: 'Paola Chávez',    phone: '70077788' },
    { name: 'Ricardo Torrez',  phone: '70088899' },
  ];
  const customers = customerDefs.map((c) => ({ id: randomUUID(), name: c.name, phone: c.phone }));
  await prisma.customer.createMany({
    data: customers.map((c) => ({ id: c.id, tenantId: tenant.id, name: c.name, phone: c.phone })),
  });
  console.log(`Clientes creados: ${customers.length}`);

  // ── Caja abierta de hoy ────────────────────────────────────────────────────
  const todayStr = toBoliviaDateString(new Date());
  const openedAt = new Date(`${todayStr}T08:00:00${BOLIVIA_OFFSET}`);
  const cashSession = await prisma.cashSession.create({
    data: {
      tenantId:      tenant.id,
      branchId:      branch.id,
      openedBy:      cashierUser.id,
      openingAmount: 200,
      status:        'OPEN',
      openedAt,
    },
  });
  console.log('Caja abierta hoy: Bs 200.00 (apertura)');

  // ── Pedidos de los últimos días (para poblar reportes y tendencias) ────────
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

  /** Fecha (YYYY-MM-DD) que queda `d` días antes de hoy. */
  const dayStrAgo = (d: number): string => {
    const date = new Date(`${todayStr}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - d);
    return date.toISOString().slice(0, 10);
  };

  const DAYS_BACK = 14;

  const ORDER_TYPES: string[]      = [OrderType.DINE_IN, OrderType.DINE_IN, OrderType.DINE_IN, OrderType.TAKEOUT, OrderType.DELIVERY];
  const PAYMENT_METHODS: string[]  = [PaymentMethod.CASH, PaymentMethod.CASH, PaymentMethod.CASH, PaymentMethod.QR, PaymentMethod.TRANSFER];

  let totalOrdersCreated = 0;
  let totalSalesCreated  = 0;
  let todaySalesCreated  = 0;
  for (let d = 0; d < DAYS_BACK; d++) {
    const dayStr     = dayStrAgo(d);
    const isToday    = dayStr === todayStr;
    const orderCount = isToday ? 34 : rand(15, 30);

    for (let i = 0; i < orderCount; i++) {
      // Hora aleatoria dentro del horario de atención (08:00–22:30 hora Bolivia).
      const hh = String(rand(8, 22)).padStart(2, '0');
      const mm = String(rand(0, 59)).padStart(2, '0');
      const ss = String(rand(0, 59)).padStart(2, '0');
      const createdAt = new Date(`${dayStr}T${hh}:${mm}:${ss}${BOLIVIA_OFFSET}`);

      // 1 a 4 productos distintos por pedido, cantidad 1-3.
      const itemCount = rand(1, 4);
      const chosenIds = new Set<string>();
      const items: { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
      while (items.length < itemCount) {
        const p = pick(createdProducts);
        if (chosenIds.has(p.id)) continue;
        chosenIds.add(p.id);
        const quantity = rand(1, 3);
        const subtotal = Math.round(quantity * p.price * 100) / 100;
        items.push({ productId: p.id, productName: p.name, quantity, unitPrice: p.price, subtotal });
      }
      const total = Math.round(items.reduce((sum, it) => sum + it.subtotal, 0) * 100) / 100;

      // El dueño también atiende alguna venta, para poblar el reporte por cajero.
      const createdBy  = Math.random() < 0.15 ? ownerUser.id : cashierUser.id;
      const customerId = Math.random() < 0.55 ? pick(customers).id : null;
      const type          = pick(ORDER_TYPES);
      const paymentMethod = pick(PAYMENT_METHODS);

      // Mayoría entregados; algunos en curso (solo hoy tiene sentido que sigan
      // pendientes); ninguno cancelado, para que las cifras del demo salgan limpias.
      const statusRoll = Math.random();
      const status = !isToday
        ? OrderStatus.DELIVERED
        : statusRoll < 0.82 ? OrderStatus.DELIVERED
        : statusRoll < 0.94 ? OrderStatus.PREPARING
        : OrderStatus.PENDING;

      // Mismo INSERT atómico que usa el repositorio real — deja BranchOrderSequence
      // consistente para que el próximo pedido creado desde la app no colisione.
      const [{ last_number: orderNumber }] = await prisma.$queryRaw<[{ last_number: number }]>`
        INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
        VALUES (${tenant.id}, ${branch.id}, ${dayStr}, 1)
        ON CONFLICT (tenant_id, branch_id, period)
        DO UPDATE SET last_number = branch_order_sequences.last_number + 1
        RETURNING last_number`;

      await prisma.order.create({
        data: {
          tenantId:      tenant.id,
          branchId:      branch.id,
          orderNumber,
          type,
          status,
          paymentMethod,
          subtotal:      total,
          total,
          createdBy,
          customerId,
          createdAt,
          updatedAt:     createdAt,
          items:    { create: items.map((it) => ({
            productId:   it.productId,
            productName: it.productName,
            quantity:    it.quantity,
            unitPrice:   it.unitPrice,
            subtotal:    it.subtotal,
          })) },
          payments: { create: [{ tenantId: tenant.id, method: paymentMethod, amount: total }] },
        },
      });
      totalSalesCreated += total;
      if (isToday) todaySalesCreated += total;
    }
    totalOrdersCreated += orderCount;
  }
  console.log(`Pedidos creados: ${totalOrdersCreated} en ${DAYS_BACK} días (Bs ${totalSalesCreated.toFixed(2)} en total; hoy Bs ${todaySalesCreated.toFixed(2)})`);

  // ── Gastos de los últimos 14 días (para poblar la tendencia de Gastos) ─────
  type ExpenseDef = {
    cat: string; name: string; unit: string | null;
    qtyMin: number; qtyMax: number; priceMin: number; priceMax: number;
  };
  const expenseDefs: ExpenseDef[] = [
    { cat: 'Insumos',         name: 'Compra de verduras y frutas', unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 80,  priceMax: 220 },
    { cat: 'Insumos',         name: 'Carne y pollo',               unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 150, priceMax: 400 },
    { cat: 'Insumos',         name: 'Abarrotes',                   unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 60,  priceMax: 180 },
    { cat: 'Personal',        name: 'Adelanto de sueldo',          unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 200, priceMax: 600 },
    { cat: 'Servicios',       name: 'Factura de luz',              unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 80,  priceMax: 220 },
    { cat: 'Servicios',       name: 'Factura de agua',             unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 40,  priceMax: 120 },
    { cat: 'Servicios',       name: 'Internet',                    unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 100, priceMax: 150 },
    { cat: 'Transporte',      name: 'Combustible',                 unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 50,  priceMax: 150 },
    { cat: 'Transporte',      name: 'Flete de mercadería',         unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 30,  priceMax: 100 },
    { cat: 'Mantenimiento',   name: 'Reparación de equipo',        unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 80,  priceMax: 300 },
    { cat: 'Operativos',      name: 'Insumos de limpieza',         unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 30,  priceMax: 100 },
    { cat: 'Administrativos', name: 'Papelería',                   unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 20,  priceMax: 80  },
    { cat: 'Otro',            name: 'Gasto varios',                unit: null,      qtyMin: 1, qtyMax: 1,  priceMin: 20,  priceMax: 90  },
    { cat: 'Gaseosas',        name: 'Coca Cola 2L',                unit: 'unidad',  qtyMin: 6, qtyMax: 24, priceMin: 8,   priceMax: 10  },
    { cat: 'Refrescos',       name: 'Sprite 2L',                   unit: 'unidad',  qtyMin: 6, qtyMax: 24, priceMin: 7,   priceMax: 9   },
  ];

  let expensesCreated = 0;
  let totalExpensesCreated = 0;
  for (let d = 0; d < DAYS_BACK; d++) {
    const dayStr  = dayStrAgo(d);
    const isToday = dayStr === todayStr;

    const expensesToday = rand(1, 3);
    for (let e = 0; e < expensesToday; e++) {
      const def = pick(expenseDefs);
      const hh = String(rand(8, 20)).padStart(2, '0');
      const mm = String(rand(0, 59)).padStart(2, '0');
      const ss = String(rand(0, 59)).padStart(2, '0');
      const expenseDate = new Date(`${dayStr}T${hh}:${mm}:${ss}${BOLIVIA_OFFSET}`);

      const quantity  = rand(def.qtyMin, def.qtyMax);
      const unitPrice = rand(def.priceMin, def.priceMax);
      const totalPrice = Math.round(quantity * unitPrice * 100) / 100;
      const categoryId = expenseCatId[def.cat];

      await prisma.expense.create({
        data: {
          tenantId:      tenant.id,
          branchId:      branch.id,
          category:      def.cat,
          amount:        totalPrice,
          createdBy:     Math.random() < 0.2 ? ownerUser.id : cashierUser.id,
          createdAt:     expenseDate,
          expenseDate,
          cashSessionId: isToday ? cashSession.id : null,
          items: {
            create: [{
              categoryId,
              name:       def.name,
              unit:       def.unit,
              quantity,
              unitPrice,
              totalPrice,
            }],
          },
        },
      });
      expensesCreated += 1;
      totalExpensesCreated += totalPrice;
    }
  }
  console.log(`Gastos creados: ${expensesCreated} en ${DAYS_BACK} días (Bs ${totalExpensesCreated.toFixed(2)} en total)`);

  // ── Sesiones de caja cerradas de días anteriores (hoy ya tiene la suya, abierta) ──
  let cashSessionsCreated = 0;
  for (let d = 1; d < DAYS_BACK; d++) {
    const dayStr = dayStrAgo(d);
    const openedAt = new Date(`${dayStr}T08:00:00${BOLIVIA_OFFSET}`);
    const closedAt = new Date(`${dayStr}T22:${String(rand(0, 59)).padStart(2, '0')}:00${BOLIVIA_OFFSET}`);

    const openingAmount  = 200;
    const expectedAmount = openingAmount + rand(300, 900);
    // La mayoría de los arqueos cuadran (ruido de redondeo); ~40% tiene un
    // sobrante o faltante real, para que el gráfico de diferencias muestre algo.
    const hasDiscrepancy = Math.random() < 0.4;
    const difference = hasDiscrepancy
      ? (Math.random() < 0.5 ? -1 : 1) * rand(5, 80)
      : rand(-2, 2);
    const closingAmount = expectedAmount + difference;

    await prisma.cashSession.create({
      data: {
        tenantId:       tenant.id,
        branchId:       branch.id,
        openedBy:       cashierUser.id,
        closedBy:       cashierUser.id,
        openingAmount,
        expectedAmount,
        closingAmount,
        difference,
        status:         'CLOSED',
        openedAt,
        closedAt,
      },
    });
    cashSessionsCreated += 1;
  }
  console.log(`Sesiones de caja cerradas creadas: ${cashSessionsCreated}`);

  console.log('\n✓ Seed completado');
  console.log('──────────────────────────────────────────────');
  console.log('  OWNER:   owner@demo.com  / demo123');
  console.log('  CASHIER: cajero@demo.com / demo123');
  console.log('  Negocio: Restaurante Demo (plan PRO, reset DAILY)');
  console.log(`  Hoy (${todayStr}): 34 pedidos, Bs ${todaySalesCreated.toFixed(2)} en ventas, ${customers.length} clientes`);
  console.log('──────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
