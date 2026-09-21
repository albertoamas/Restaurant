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
  for (const ec of expenseCats) {
    await prisma.expenseCategory.create({
      data: { tenantId: tenant.id, name: ec.name, trackQuantity: ec.trackQuantity, sortOrder: ec.sortOrder },
    });
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

  const createdProducts: { id: string; name: string; price: number }[] = [];
  for (const p of products) {
    const created = await prisma.product.create({
      data: {
        tenantId:   tenant.id,
        categoryId: catId[p.cat],
        name:       p.name,
        price:      p.price,
      },
    });
    createdProducts.push({ id: created.id, name: created.name, price: Number(created.price) });
  }
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
  const customers: { id: string; name: string }[] = [];
  for (const c of customerDefs) {
    const created = await prisma.customer.create({
      data: { tenantId: tenant.id, name: c.name, phone: c.phone },
    });
    customers.push({ id: created.id, name: created.name });
  }
  console.log(`Clientes creados: ${customers.length}`);

  // ── Caja abierta de hoy ────────────────────────────────────────────────────
  const todayStr = toBoliviaDateString(new Date());
  const openedAt = new Date(`${todayStr}T08:00:00${BOLIVIA_OFFSET}`);
  await prisma.cashSession.create({
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

  // ── Pedidos de hoy (para poblar reportes) ───────────────────────────────────
  const rand      = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];

  const ORDER_TYPES: string[]      = [OrderType.DINE_IN, OrderType.DINE_IN, OrderType.DINE_IN, OrderType.TAKEOUT, OrderType.DELIVERY];
  const PAYMENT_METHODS: string[]  = [PaymentMethod.CASH, PaymentMethod.CASH, PaymentMethod.CASH, PaymentMethod.QR, PaymentMethod.TRANSFER];
  const ORDER_COUNT = 34;

  let totalSalesCreated = 0;
  for (let i = 0; i < ORDER_COUNT; i++) {
    // Hora aleatoria dentro del horario de atención (08:00–22:30 hora Bolivia).
    const hh = String(rand(8, 22)).padStart(2, '0');
    const mm = String(rand(0, 59)).padStart(2, '0');
    const ss = String(rand(0, 59)).padStart(2, '0');
    const createdAt = new Date(`${todayStr}T${hh}:${mm}:${ss}${BOLIVIA_OFFSET}`);

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

    // Mayoría entregados; algunos en curso; ninguno cancelado, para que las
    // cifras de venta del demo salgan limpias.
    const statusRoll = Math.random();
    const status =
      statusRoll < 0.82 ? OrderStatus.DELIVERED
      : statusRoll < 0.94 ? OrderStatus.PREPARING
      : OrderStatus.PENDING;

    // Mismo INSERT atómico que usa el repositorio real — deja BranchOrderSequence
    // consistente para que el próximo pedido creado desde la app no colisione.
    const [{ last_number: orderNumber }] = await prisma.$queryRaw<[{ last_number: number }]>`
      INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
      VALUES (${tenant.id}, ${branch.id}, ${todayStr}, 1)
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
  }
  console.log(`Pedidos de hoy creados: ${ORDER_COUNT} (Bs ${totalSalesCreated.toFixed(2)} en ventas)`);

  console.log('\n✓ Seed completado');
  console.log('──────────────────────────────────────────────');
  console.log('  OWNER:   owner@demo.com  / demo123');
  console.log('  CASHIER: cajero@demo.com / demo123');
  console.log('  Negocio: Restaurante Demo (plan PRO, reset DAILY)');
  console.log(`  Hoy (${todayStr}): ${ORDER_COUNT} pedidos, Bs ${totalSalesCreated.toFixed(2)} en ventas, ${customers.length} clientes`);
  console.log('──────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
