/**
 * Seed script — datos de demostración completos
 * Uso: pnpm --filter backend seed
 *
 * Cubre los 21 modelos del schema: planes, tenants, sucursales, usuarios,
 * catálogo, pedidos (con pagos mixtos y cancelados), caja, gastos (con catálogo
 * de conceptos y anulaciones), clientes y sorteos en sus dos modalidades.
 *
 * Credenciales:
 *   OWNER:   owner@demo.com   / demo123
 *   CASHIER: cajero@demo.com  / demo123   (sucursal Principal)
 *   CASHIER: cajera2@demo.com / demo123   (sucursal Norte)
 *   Segundo negocio (plan BASICO, para probar aislamiento y límites):
 *   OWNER:   owner@cafe.com   / demo123
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

/** Días de historia que genera el seed. 14 llena las tendencias sin inflar la BD. */
const DAYS_BACK = 14;

// ── Utilidades ───────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const money = (n: number) => Math.round(n * 100) / 100;

/** Instante UTC de una hora concreta en hora Bolivia. */
const atBolivia = (dayStr: string, hh: number, mm: number, ss = 0) =>
  new Date(
    `${dayStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:` +
    `${String(ss).padStart(2, '0')}${BOLIVIA_OFFSET}`,
  );

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('ABORTADO: seed no puede ejecutarse en NODE_ENV=production');
    process.exit(1);
  }

  console.log('Conectado a la base de datos');

  // Borrar el tenant cascadea a todas sus tablas; los planes son globales.
  console.log('Limpiando datos anteriores...');
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  // ── Planes globales ────────────────────────────────────────────────────────
  await prisma.plan.createMany({
    data: [
      {
        id: 'BASICO', displayName: 'Básico', priceBs: 220,
        // Sin teamEnabled: Equipo no se vende por plan, se deriva de maxCashiers.
        maxBranches: 1, maxCashiers: 2, maxProducts: 80,
        kitchenEnabled: false, rafflesEnabled: false,
        advancedReports: false, reportHistoryDays: 90, maxStorageMb: 100,
      },
      {
        id: 'PRO', displayName: 'Pro', priceBs: 399,
        maxBranches: 3, maxCashiers: 8, maxProducts: 500,
        kitchenEnabled: true, rafflesEnabled: true,
        advancedReports: true, reportHistoryDays: 365, maxStorageMb: 1024,
      },
      {
        id: 'NEGOCIO', displayName: 'Negocio', priceBs: 790,
        // Topes reales en lo que consume recursos; el historial queda sin límite
        // porque son los datos del propio cliente.
        maxBranches: 10, maxCashiers: 30, maxProducts: 2000,
        kitchenEnabled: true, rafflesEnabled: true,
        advancedReports: true, reportHistoryDays: -1, maxStorageMb: 5120,
      },
    ],
  });
  console.log('Planes creados: BASICO, PRO, NEGOCIO');

  // ── Tenant principal ───────────────────────────────────────────────────────
  // Los flags coinciden con lo que otorga el plan PRO, así que `moduleOverrides`
  // queda en null: no hay ninguna excepción concedida a mano.
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Restaurante Demo',
      slug: 'demo',
      plan: 'PRO',
      orderNumberResetPeriod: 'DAILY',
      ordersEnabled: true,
      cashEnabled: true,
      teamEnabled: true,
      branchesEnabled: true,
      kitchenEnabled: true,
      rafflesEnabled: true,
      advancedReportsEnabled: true,
      businessAddress: 'Av. Ballivián #1234, Cochabamba',
      businessPhone: '+591 4 4567890',
      receiptSlogan: '¡Gracias por su preferencia!',
    },
  });
  console.log(`Tenant creado: ${tenant.name} (plan PRO)`);

  // ── Sucursales ─────────────────────────────────────────────────────────────
  const branchPrincipal = await prisma.branch.create({
    data: {
      tenantId: tenant.id, name: 'Principal',
      address: 'Av. Ballivián #1234', phone: '+591 4 4567890',
    },
  });
  const branchNorte = await prisma.branch.create({
    data: {
      tenantId: tenant.id, name: 'Sucursal Norte',
      address: 'Av. América #567', phone: '+591 4 4551122',
    },
  });
  const branches = [branchPrincipal, branchNorte];
  console.log('Sucursales creadas: Principal, Sucursal Norte');

  // ── Usuarios ───────────────────────────────────────────────────────────────
  const ownerUser = await prisma.user.create({
    data: {
      tenantId: tenant.id, email: 'owner@demo.com', passwordHash: PASSWORD_HASH,
      name: 'Administrador', role: 'OWNER',
    },
  });
  const cashierPrincipal = await prisma.user.create({
    data: {
      tenantId: tenant.id, branchId: branchPrincipal.id, email: 'cajero@demo.com',
      passwordHash: PASSWORD_HASH, name: 'Marcela Rojas', role: 'CASHIER',
    },
  });
  const cashierNorte = await prisma.user.create({
    data: {
      tenantId: tenant.id, branchId: branchNorte.id, email: 'cajera2@demo.com',
      passwordHash: PASSWORD_HASH, name: 'Iván Céspedes', role: 'CASHIER',
    },
  });
  // Cajero dado de baja: libera cupo del plan y prueba que el login lo rechace.
  await prisma.user.create({
    data: {
      tenantId: tenant.id, branchId: branchPrincipal.id, email: 'exempleado@demo.com',
      passwordHash: PASSWORD_HASH, name: 'Pedro Gutiérrez', role: 'CASHIER', isActive: false,
    },
  });
  const cashierByBranch: Record<string, string> = {
    [branchPrincipal.id]: cashierPrincipal.id,
    [branchNorte.id]: cashierNorte.id,
  };
  console.log('Usuarios creados: 1 owner, 2 cajeros activos, 1 cajero inactivo');

  // ── Categorías del catálogo ────────────────────────────────────────────────
  const categoryDefs = [
    { name: 'Platos principales', sortOrder: 1, isActive: true },
    { name: 'Entradas',           sortOrder: 2, isActive: true },
    { name: 'Bebidas',            sortOrder: 3, isActive: true },
    { name: 'Postres',            sortOrder: 4, isActive: true },
    { name: 'Extras',             sortOrder: 5, isActive: true },
    // Categoría archivada: prueba que el POS la oculte y el reporte histórico no.
    { name: 'Promos de invierno', sortOrder: 6, isActive: false },
  ];
  const catId: Record<string, string> = {};
  for (const c of categoryDefs) {
    const created = await prisma.category.create({ data: { tenantId: tenant.id, ...c } });
    catId[c.name] = created.id;
  }
  console.log(`Categorías creadas: ${categoryDefs.length} (1 archivada)`);

  // ── Productos ──────────────────────────────────────────────────────────────
  const productDefs = [
    { cat: 'Platos principales', name: 'Pique macho',          price: 65, isActive: true },
    { cat: 'Platos principales', name: 'Silpancho',            price: 48, isActive: true },
    { cat: 'Platos principales', name: 'Pollo a la plancha',   price: 55, isActive: true },
    { cat: 'Platos principales', name: 'Milanesa de res',      price: 50, isActive: true },
    { cat: 'Platos principales', name: 'Pasta al pesto',       price: 45, isActive: true },
    { cat: 'Platos principales', name: 'Hamburguesa clásica',  price: 42, isActive: true },
    { cat: 'Entradas',           name: 'Ensalada mixta',       price: 22, isActive: true },
    { cat: 'Entradas',           name: 'Sopa de maní',         price: 20, isActive: true },
    { cat: 'Entradas',           name: 'Salteña',              price: 10, isActive: true },
    { cat: 'Bebidas',            name: 'Agua mineral',         price:  8, isActive: true },
    { cat: 'Bebidas',            name: 'Refresco',             price: 12, isActive: true },
    { cat: 'Bebidas',            name: 'Jugo natural',         price: 15, isActive: true },
    { cat: 'Bebidas',            name: 'Cerveza',              price: 20, isActive: true },
    { cat: 'Bebidas',            name: 'Café',                 price: 10, isActive: true },
    { cat: 'Postres',            name: 'Helado 2 bochas',      price: 15, isActive: true },
    { cat: 'Postres',            name: 'Torta del día',        price: 18, isActive: true },
    { cat: 'Postres',            name: 'Flan casero',          price: 14, isActive: true },
    { cat: 'Extras',             name: 'Porción de papas',     price: 12, isActive: true },
    { cat: 'Extras',             name: 'Salsa adicional',      price:  4, isActive: true },
    { cat: 'Extras',             name: 'Pan adicional',        price:  5, isActive: true },
    // Producto descontinuado: sigue existiendo en pedidos viejos por el snapshot
    // de nombre/precio en order_items, pero ya no se puede vender.
    { cat: 'Promos de invierno', name: 'Combo sopa + segundo', price: 55, isActive: false },
  ];
  const products = productDefs.map((p) => ({ id: randomUUID(), ...p }));
  await prisma.product.createMany({
    data: products.map((p) => ({
      id: p.id, tenantId: tenant.id, categoryId: catId[p.cat],
      name: p.name, price: p.price, isActive: p.isActive,
    })),
  });
  const sellableProducts = products.filter((p) => p.isActive);
  console.log(`Productos creados: ${products.length} (1 descontinuado)`);

  // ── Catálogo de gastos: categorías ─────────────────────────────────────────
  const expenseCatDefs = [
    { name: 'Insumos',         icon: '🧂', trackQuantity: true,  sortOrder: 10 },
    { name: 'Gaseosas',        icon: '🥤', trackQuantity: true,  sortOrder: 20 },
    { name: 'Personal',        icon: '👤', trackQuantity: false, sortOrder: 30 },
    { name: 'Servicios',       icon: '💡', trackQuantity: false, sortOrder: 40 },
    { name: 'Transporte',      icon: '🚗', trackQuantity: false, sortOrder: 50 },
    { name: 'Mantenimiento',   icon: '🔧', trackQuantity: false, sortOrder: 60 },
    { name: 'Operativos',      icon: '🧽', trackQuantity: false, sortOrder: 70 },
    { name: 'Administrativos', icon: '📄', trackQuantity: false, sortOrder: 80 },
    { name: 'Otro',            icon: '📋', trackQuantity: false, sortOrder: 99 },
  ];
  const expCatId: Record<string, string> = {};
  for (const ec of expenseCatDefs) {
    const created = await prisma.expenseCategory.create({ data: { tenantId: tenant.id, ...ec } });
    expCatId[ec.name] = created.id;
  }

  // ── Catálogo de gastos: conceptos reusables ────────────────────────────────
  // `unit` + `defaultUnitPrice` solo en los que se compran por cantidad; el
  // resto son montos libres. Los items guardan su propio snapshot, así que
  // editar este catálogo no altera el histórico.
  const conceptDefs = [
    { cat: 'Insumos',         name: 'Carne de res',          unit: 'kg',     price: 38,   sortOrder: 10 },
    { cat: 'Insumos',         name: 'Pollo',                 unit: 'kg',     price: 22,   sortOrder: 20 },
    { cat: 'Insumos',         name: 'Papa',                  unit: 'arroba', price: 45,   sortOrder: 30 },
    { cat: 'Insumos',         name: 'Verduras y frutas',     unit: null,     price: null, sortOrder: 40 },
    { cat: 'Insumos',         name: 'Abarrotes',             unit: null,     price: null, sortOrder: 50 },
    { cat: 'Gaseosas',        name: 'Coca Cola 2L',          unit: 'unidad', price: 9,    sortOrder: 10 },
    { cat: 'Gaseosas',        name: 'Sprite 2L',             unit: 'unidad', price: 8,    sortOrder: 20 },
    { cat: 'Gaseosas',        name: 'Fanta 2L',              unit: 'unidad', price: 8,    sortOrder: 30 },
    { cat: 'Personal',        name: 'Adelanto de sueldo',    unit: null,     price: null, sortOrder: 10 },
    { cat: 'Personal',        name: 'Bono de productividad', unit: null,     price: null, sortOrder: 20 },
    { cat: 'Servicios',       name: 'Factura de luz',        unit: null,     price: null, sortOrder: 10 },
    { cat: 'Servicios',       name: 'Factura de agua',       unit: null,     price: null, sortOrder: 20 },
    { cat: 'Servicios',       name: 'Garrafa de gas',        unit: 'unidad', price: 30,   sortOrder: 30 },
    { cat: 'Servicios',       name: 'Internet',              unit: null,     price: null, sortOrder: 40 },
    { cat: 'Transporte',      name: 'Combustible',           unit: null,     price: null, sortOrder: 10 },
    { cat: 'Transporte',      name: 'Flete de mercadería',   unit: null,     price: null, sortOrder: 20 },
    { cat: 'Mantenimiento',   name: 'Reparación de equipo',  unit: null,     price: null, sortOrder: 10 },
    { cat: 'Operativos',      name: 'Insumos de limpieza',   unit: null,     price: null, sortOrder: 10 },
    { cat: 'Administrativos', name: 'Papelería',             unit: null,     price: null, sortOrder: 10 },
    { cat: 'Otro',            name: 'Gasto varios',          unit: null,     price: null, sortOrder: 10 },
  ];
  const concepts = conceptDefs.map((c) => ({ id: randomUUID(), ...c }));
  await prisma.expenseConcept.createMany({
    data: concepts.map((c) => ({
      id: c.id, tenantId: tenant.id, categoryId: expCatId[c.cat],
      name: c.name, unit: c.unit, defaultUnitPrice: c.price, sortOrder: c.sortOrder,
    })),
  });
  console.log(`Catálogo de gastos: ${expenseCatDefs.length} categorías, ${concepts.length} conceptos`);

  // ── Clientes ───────────────────────────────────────────────────────────────
  const customerDefs = [
    { name: 'Ana Flores',      phone: '70011122', email: 'ana.flores@mail.com',  notes: 'Prefiere mesa junto a la ventana' },
    { name: 'Carlos Mamani',   phone: '70022233', email: null,                   notes: null },
    { name: 'Lucía Vargas',    phone: '70033344', email: 'lucia.v@mail.com',     notes: 'Alérgica al maní' },
    { name: 'Jorge Quispe',    phone: '70044455', email: null,                   notes: null },
    { name: 'María Rojas',     phone: '70055566', email: 'maria.rojas@mail.com', notes: null },
    { name: 'Diego Fernández', phone: '70066677', email: null,                   notes: 'Cliente frecuente del delivery' },
    { name: 'Paola Chávez',    phone: '70077788', email: null,                   notes: null },
    { name: 'Ricardo Torrez',  phone: '70088899', email: 'r.torrez@mail.com',    notes: null },
    { name: 'Silvia Camacho',  phone: '70099900', email: null,                   notes: null },
    { name: 'Hugo Salazar',    phone: '70100011', email: null,                   notes: null },
    { name: 'Elena Peredo',    phone: '70111122', email: 'elena.p@mail.com',     notes: null },
    { name: 'Marco Antezana',  phone: '70122233', email: null,                   notes: null },
  ];
  const customers = customerDefs.map((c) => ({ id: randomUUID(), ...c }));
  await prisma.customer.createMany({
    data: customers.map((c) => ({
      id: c.id, tenantId: tenant.id, name: c.name,
      phone: c.phone, email: c.email, notes: c.notes,
    })),
  });
  console.log(`Clientes creados: ${customers.length}`);

  // ── Fechas de trabajo ──────────────────────────────────────────────────────
  const todayStr = toBoliviaDateString(new Date());
  const dayStrAgo = (d: number): string => {
    const date = new Date(`${todayStr}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - d);
    return date.toISOString().slice(0, 10);
  };

  // ── Caja abierta de hoy, una por sucursal ──────────────────────────────────
  // Se crean antes que los gastos porque los de hoy se enlazan a la sesión viva.
  const openSessionByBranch: Record<string, string> = {};
  for (const branch of branches) {
    const session = await prisma.cashSession.create({
      data: {
        tenantId: tenant.id, branchId: branch.id,
        openedBy: cashierByBranch[branch.id],
        openingAmount: 200, status: 'OPEN',
        openedAt: atBolivia(todayStr, 8, 0),
      },
    });
    openSessionByBranch[branch.id] = session.id;
  }
  console.log('Cajas abiertas hoy: 2 (una por sucursal), Bs 200.00 de apertura');

  // ── Pedidos ────────────────────────────────────────────────────────────────
  const ORDER_TYPES: string[] = [
    OrderType.DINE_IN, OrderType.DINE_IN, OrderType.DINE_IN, OrderType.TAKEOUT, OrderType.DELIVERY,
  ];
  const ORDER_NOTES = [
    'Sin cebolla', 'Para llevar en dos bolsas', 'Poco picante',
    'Mesa 4', 'Cliente pidió factura', 'Sin sal',
  ];

  /** Efectivo cobrado por sucursal y día — alimenta el arqueo de caja. */
  const cashByBranchDay: Record<string, number> = {};
  const addCash = (branchId: string, dayStr: string, amount: number) => {
    const key = `${branchId}|${dayStr}`;
    cashByBranchDay[key] = (cashByBranchDay[key] ?? 0) + amount;
  };

  /**
   * Reparte el total en 1 o 2 pagos. El método dominante (el de mayor monto) es
   * el que se guarda en `orders.payment_method` para compatibilidad y display;
   * los reportes suman siempre desde `order_payments`.
   */
  const buildPayments = (total: number): { method: string; amount: number }[] => {
    const roll = Math.random();
    if (roll < 0.03) return [{ method: PaymentMethod.CORTESIA, amount: total }];
    if (roll < 0.18 && total >= 40) {
      // Pago mixto: una parte en efectivo y el resto por QR o transferencia.
      const cashPart = money(total * (rand(30, 70) / 100));
      const rest = money(total - cashPart);
      const other = Math.random() < 0.6 ? PaymentMethod.QR : PaymentMethod.TRANSFER;
      return [
        { method: PaymentMethod.CASH, amount: cashPart },
        { method: other, amount: rest },
      ];
    }
    const single = roll < 0.62 ? PaymentMethod.CASH
      : roll < 0.85 ? PaymentMethod.QR
      : PaymentMethod.TRANSFER;
    return [{ method: single, amount: total }];
  };

  let ordersCreated = 0;
  let salesCreated = 0;
  let todaySales = 0;
  let cancelledCreated = 0;
  let splitCreated = 0;
  /** Pedidos con cliente, guardados para generar tickets de sorteo después. */
  const ordersWithCustomer: {
    id: string; customerId: string; total: number; productIds: string[]; createdAt: Date;
  }[] = [];

  for (let d = DAYS_BACK - 1; d >= 0; d--) {
    const dayStr = dayStrAgo(d);
    const isToday = dayStr === todayStr;

    for (const branch of branches) {
      // La Principal vende más que la Norte: así la comparativa entre sucursales
      // muestra una diferencia real en vez de dos barras iguales.
      const base = branch.id === branchPrincipal.id ? rand(14, 22) : rand(7, 13);
      const orderCount = isToday ? Math.round(base * 0.8) : base;

      for (let i = 0; i < orderCount; i++) {
        const createdAt = atBolivia(dayStr, rand(8, 22), rand(0, 59), rand(0, 59));

        // 1 a 4 productos distintos, cantidad 1-3.
        const itemCount = rand(1, 4);
        const chosen = new Set<string>();
        const items: {
          productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number;
        }[] = [];
        while (items.length < itemCount) {
          const p = pick(sellableProducts);
          if (chosen.has(p.id)) continue;
          chosen.add(p.id);
          const quantity = rand(1, 3);
          items.push({
            productId: p.id, productName: p.name, quantity,
            unitPrice: p.price, subtotal: money(quantity * p.price),
          });
        }
        const total = money(items.reduce((s, it) => s + it.subtotal, 0));

        // El dueño también atiende: puebla el reporte por cajero con dos nombres.
        const createdBy = Math.random() < 0.15 ? ownerUser.id : cashierByBranch[branch.id];
        const customerId = Math.random() < 0.55 ? pick(customers).id : null;

        // Un pedido cancelado no cobra: no lleva pagos ni suma al arqueo.
        const statusRoll = Math.random();
        const status = statusRoll < 0.04 ? OrderStatus.CANCELLED
          : !isToday ? OrderStatus.DELIVERED
          : statusRoll < 0.82 ? OrderStatus.DELIVERED
          : statusRoll < 0.94 ? OrderStatus.PREPARING
          : OrderStatus.PENDING;
        const isCancelled = status === OrderStatus.CANCELLED;

        const payments = isCancelled ? [] : buildPayments(total);
        const dominant = payments.length
          ? [...payments].sort((a, b) => b.amount - a.amount)[0].method
          : null;
        if (payments.length > 1) splitCreated++;

        // Mismo INSERT atómico que usa el repositorio real, para que el próximo
        // pedido creado desde la app no colisione con la numeración sembrada.
        const [{ last_number: orderNumber }] = await prisma.$queryRaw<[{ last_number: number }]>`
          INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
          VALUES (${tenant.id}, ${branch.id}, ${dayStr}, 1)
          ON CONFLICT (tenant_id, branch_id, period)
          DO UPDATE SET last_number = branch_order_sequences.last_number + 1
          RETURNING last_number`;

        const orderId = randomUUID();
        await prisma.order.create({
          data: {
            id: orderId,
            tenantId: tenant.id, branchId: branch.id, orderNumber,
            type: pick(ORDER_TYPES), status,
            paymentMethod: dominant,
            subtotal: total, total,
            notes: Math.random() < 0.2 ? pick(ORDER_NOTES) : null,
            createdBy, customerId,
            createdAt, updatedAt: createdAt,
            items: { create: items },
            payments: {
              create: payments.map((p) => ({
                tenantId: tenant.id, method: p.method, amount: p.amount,
              })),
            },
          },
        });

        ordersCreated++;
        if (isCancelled) {
          cancelledCreated++;
        } else {
          salesCreated += total;
          if (isToday) todaySales += total;
          const cash = payments
            .filter((p) => p.method === PaymentMethod.CASH)
            .reduce((s, p) => s + p.amount, 0);
          if (cash > 0) addCash(branch.id, dayStr, cash);
          if (customerId) {
            ordersWithCustomer.push({
              id: orderId, customerId, total,
              productIds: items.map((it) => it.productId), createdAt,
            });
          }
        }
      }
    }
  }
  console.log(
    `Pedidos creados: ${ordersCreated} en ${DAYS_BACK} días y 2 sucursales ` +
    `(${cancelledCreated} cancelados, ${splitCreated} con pago mixto; ` +
    `Bs ${salesCreated.toFixed(2)} vendidos)`,
  );

  // ── Cajas cerradas de días anteriores ──────────────────────────────────────
  // `expectedAmount` sale del efectivo realmente cobrado ese día, no de un
  // número al azar: así el arqueo del demo cuadra con lo que calcula la app.
  let closedSessions = 0;
  for (let d = 1; d < DAYS_BACK; d++) {
    const dayStr = dayStrAgo(d);
    for (const branch of branches) {
      const openingAmount = 200;
      const cashSales = money(cashByBranchDay[`${branch.id}|${dayStr}`] ?? 0);
      const expectedAmount = money(openingAmount + cashSales);
      // La mayoría cuadra salvo redondeo; ~30% tiene un faltante o sobrante real
      // para que el gráfico de diferencias tenga algo que mostrar.
      const difference = Math.random() < 0.3
        ? (Math.random() < 0.5 ? -1 : 1) * rand(5, 60)
        : rand(-2, 2);
      await prisma.cashSession.create({
        data: {
          tenantId: tenant.id, branchId: branch.id,
          openedBy: cashierByBranch[branch.id], closedBy: cashierByBranch[branch.id],
          openingAmount, expectedAmount,
          closingAmount: money(expectedAmount + difference),
          difference, status: 'CLOSED',
          openedAt: atBolivia(dayStr, 8, 0),
          // Cierra despues del ultimo pedido posible (22:59): si cerrara antes,
          // el efectivo de las ultimas ventas quedaria fuera del arqueo y la
          // diferencia sembrada no coincidiria con la que calcula la app.
          closedAt: atBolivia(dayStr, 23, rand(0, 30)),
          notes: Math.abs(difference) > 20 ? 'Diferencia reportada al administrador' : null,
        },
      });
      closedSessions++;
    }
  }
  console.log(`Sesiones de caja cerradas: ${closedSessions}`);

  // ── Gastos ─────────────────────────────────────────────────────────────────
  const SUPPLIERS = [
    'Distribuidora La Paz', 'Mercado Calatayud', 'Embol S.A.',
    'Ferretería Central', 'Proveedor varios',
  ];
  const EXPENSE_PAYMENTS: string[] = [
    PaymentMethod.CASH, PaymentMethod.CASH, PaymentMethod.TRANSFER, PaymentMethod.QR,
  ];

  let expensesCreated = 0;
  let expensesVoided = 0;
  let expensesTotal = 0;
  for (let d = 0; d < DAYS_BACK; d++) {
    const dayStr = dayStrAgo(d);
    const isToday = dayStr === todayStr;

    for (const branch of branches) {
      const count = branch.id === branchPrincipal.id ? rand(1, 3) : rand(0, 2);
      for (let e = 0; e < count; e++) {
        const concept = pick(concepts);
        const expenseDate = atBolivia(dayStr, rand(8, 20), rand(0, 59), rand(0, 59));

        // Los conceptos con unidad se compran por cantidad; el resto es monto libre.
        const hasUnit = concept.unit !== null;
        const quantity = hasUnit ? rand(2, 20) : 1;
        const unitPrice = hasUnit
          ? money((concept.price ?? 10) * (rand(90, 115) / 100))
          : rand(40, 450);
        const totalPrice = money(quantity * unitPrice);

        // Un gasto anulado conserva la fila (borrado lógico) y queda fuera de
        // todas las lecturas, que filtran status = 'ACTIVE'.
        const isVoided = Math.random() < 0.06;

        await prisma.expense.create({
          data: {
            tenantId: tenant.id, branchId: branch.id,
            category: concept.cat,
            amount: totalPrice,
            description: Math.random() < 0.4 ? `Compra en ${pick(SUPPLIERS)}` : null,
            createdBy: Math.random() < 0.2 ? ownerUser.id : cashierByBranch[branch.id],
            createdAt: expenseDate,
            expenseDate,
            paymentMethod: pick(EXPENSE_PAYMENTS),
            supplierName: Math.random() < 0.5 ? pick(SUPPLIERS) : null,
            documentNumber: Math.random() < 0.3 ? `F-${rand(1000, 9999)}` : null,
            cashSessionId: isToday ? openSessionByBranch[branch.id] : null,
            status: isVoided ? 'VOIDED' : 'ACTIVE',
            voidedAt: isVoided ? new Date(expenseDate.getTime() + 3600_000) : null,
            voidedBy: isVoided ? ownerUser.id : null,
            voidReason: isVoided ? 'Cargado por error' : null,
            items: {
              create: [{
                categoryId: expCatId[concept.cat],
                conceptId: concept.id,
                name: concept.name,
                unit: concept.unit,
                quantity, unitPrice, totalPrice,
              }],
            },
          },
        });
        expensesCreated++;
        if (isVoided) expensesVoided++;
        else expensesTotal += totalPrice;
      }
    }
  }
  console.log(
    `Gastos creados: ${expensesCreated} (${expensesVoided} anulados; ` +
    `Bs ${expensesTotal.toFixed(2)} vigentes)`,
  );

  // ── Sorteo 1: por producto, en curso ───────────────────────────────────────
  const raffleProduct = products.find((p) => p.name === 'Pique macho')!;
  const raffle1 = await prisma.raffle.create({
    data: {
      tenantId: tenant.id,
      name: 'Sorteo de Aniversario',
      description: 'Cada Pique macho que compres te da un ticket para el sorteo.',
      status: 'ACTIVE',
      numberOfWinners: 2,
      ticketMode: 'PRODUCT_MATCH',
      productId: raffleProduct.id,
      prizes: {
        create: [
          { position: 1, prizeDescription: 'Cena para dos personas' },
          { position: 2, prizeDescription: 'Postre gratis durante un mes' },
        ],
      },
    },
  });

  // Un ticket por cada pedido con cliente que incluyó el producto del sorteo.
  const matching = ordersWithCustomer.filter((o) => o.productIds.includes(raffleProduct.id));
  let ticketNumber = 0;
  const raffle1Tickets = matching.map((o) => {
    const delivered = Math.random() < 0.6;
    return {
      id: randomUUID(),
      tenantId: tenant.id,
      raffleId: raffle1.id,
      customerId: o.customerId,
      ticketNumber: ++ticketNumber,
      orderId: o.id,
      // Los tickets físicos se entregan cuando el cliente vuelve; no todos aún.
      delivered,
      deliveredAt: delivered ? new Date(o.createdAt.getTime() + 86_400_000) : null,
      createdAt: o.createdAt,
    };
  });
  if (raffle1Tickets.length) await prisma.raffleTicket.createMany({ data: raffle1Tickets });
  console.log(
    `Sorteo "Sorteo de Aniversario" (PRODUCT_MATCH, ACTIVE): ${raffle1Tickets.length} tickets`,
  );

  // ── Sorteo 2: por monto gastado, ya sorteado ───────────────────────────────
  const THRESHOLD = 200;
  const raffle2 = await prisma.raffle.create({
    data: {
      tenantId: tenant.id,
      name: 'Sorteo Fiestas Patrias',
      description: `Cada Bs ${THRESHOLD} de consumo acumulado te dan un ticket.`,
      status: 'DRAWN',
      numberOfWinners: 3,
      ticketMode: 'SPENDING_THRESHOLD',
      spendingThreshold: THRESHOLD,
      prizes: {
        create: [
          { position: 1, prizeDescription: 'Televisor 32 pulgadas' },
          { position: 2, prizeDescription: 'Canasta de productos' },
          { position: 3, prizeDescription: 'Vale de consumo de Bs 200' },
        ],
      },
    },
  });

  // Acumulado real por cliente, a partir de sus pedidos.
  const spentByCustomer: Record<string, number> = {};
  for (const o of ordersWithCustomer) {
    spentByCustomer[o.customerId] = (spentByCustomer[o.customerId] ?? 0) + o.total;
  }

  const spendingRows: {
    id: string; tenantId: string; raffleId: string; customerId: string; totalSpent: number;
  }[] = [];
  // orderId queda null: el ticket nace del acumulado, no de una compra puntual.
  const raffle2Tickets: {
    id: string; tenantId: string; raffleId: string; customerId: string;
    ticketNumber: number; orderId: null; delivered: boolean; createdAt: Date;
  }[] = [];
  let ticketNumber2 = 0;
  for (const [customerId, spent] of Object.entries(spentByCustomer)) {
    const totalSpent = money(spent);
    spendingRows.push({
      id: randomUUID(), tenantId: tenant.id, raffleId: raffle2.id, customerId, totalSpent,
    });

    const earned = Math.floor(totalSpent / THRESHOLD);
    for (let t = 0; t < earned; t++) {
      raffle2Tickets.push({
        id: randomUUID(), tenantId: tenant.id, raffleId: raffle2.id, customerId,
        ticketNumber: ++ticketNumber2, orderId: null,
        delivered: true, createdAt: atBolivia(dayStrAgo(3), 12, 0),
      });
    }
  }
  if (spendingRows.length) await prisma.customerRaffleSpending.createMany({ data: spendingRows });
  if (raffle2Tickets.length) await prisma.raffleTicket.createMany({ data: raffle2Tickets });

  // Ganadores: uno por posición. El de la 3ª se anuló y se volvió a sortear, que
  // es el caso que ejercita los índices parciales (una sola fila no anulada por
  // posición, y un ticket no puede ganar dos veces).
  const drawnAt = atBolivia(dayStrAgo(1), 20, 0);
  const winnerTickets: typeof raffle2Tickets = [];
  const usedCustomers = new Set<string>();
  for (const t of raffle2Tickets) {
    if (winnerTickets.length >= 4) break;
    if (usedCustomers.has(t.customerId)) continue;
    usedCustomers.add(t.customerId);
    winnerTickets.push(t);
  }

  if (winnerTickets.length >= 4) {
    await prisma.raffleWinner.createMany({
      data: [
        {
          tenantId: tenant.id, raffleId: raffle2.id, position: 3,
          customerId: winnerTickets[0].customerId, ticketId: winnerTickets[0].id,
          prizeDescription: 'Vale de consumo de Bs 200', drawnAt, voided: true,
        },
        {
          tenantId: tenant.id, raffleId: raffle2.id, position: 3,
          customerId: winnerTickets[1].customerId, ticketId: winnerTickets[1].id,
          prizeDescription: 'Vale de consumo de Bs 200',
          drawnAt: new Date(drawnAt.getTime() + 300_000), voided: false,
        },
        {
          tenantId: tenant.id, raffleId: raffle2.id, position: 2,
          customerId: winnerTickets[2].customerId, ticketId: winnerTickets[2].id,
          prizeDescription: 'Canasta de productos',
          drawnAt: new Date(drawnAt.getTime() + 600_000), voided: false,
        },
        {
          tenantId: tenant.id, raffleId: raffle2.id, position: 1,
          customerId: winnerTickets[3].customerId, ticketId: winnerTickets[3].id,
          prizeDescription: 'Televisor 32 pulgadas',
          drawnAt: new Date(drawnAt.getTime() + 900_000), voided: false,
        },
      ],
    });
  }
  console.log(
    `Sorteo "Sorteo Fiestas Patrias" (SPENDING_THRESHOLD, DRAWN): ` +
    `${raffle2Tickets.length} tickets, ${spendingRows.length} acumulados, ` +
    `${winnerTickets.length >= 4 ? '3 ganadores (1 anulado y resorteado)' : 'sin ganadores'}`,
  );

  // ── Segundo tenant: plan BASICO ────────────────────────────────────────────
  // Mínimo a propósito. Sirve para verificar el aislamiento entre negocios y que
  // el plan BASICO recorta módulos (sin cocina, sorteos, equipo ni reportes
  // avanzados) sin tener que dar de alta uno a mano cada vez.
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Café del Centro',
      slug: 'cafe-centro',
      plan: 'BASICO',
      orderNumberResetPeriod: 'MONTHLY',
      ordersEnabled: true, cashEnabled: true,
      // teamEnabled true: BASICO vende 2 cajeros, el limite lo pone maxCashiers.
      teamEnabled: true, branchesEnabled: false,
      kitchenEnabled: false, rafflesEnabled: false, advancedReportsEnabled: false,
      businessAddress: 'Calle Bolívar #89, Cochabamba',
      businessPhone: '+591 4 4223344',
      receiptSlogan: 'Café de altura',
    },
  });
  const branch2 = await prisma.branch.create({
    data: { tenantId: tenant2.id, name: 'Principal', address: 'Calle Bolívar #89' },
  });
  const owner2 = await prisma.user.create({
    data: {
      tenantId: tenant2.id, email: 'owner@cafe.com', passwordHash: PASSWORD_HASH,
      name: 'Dueño Café', role: 'OWNER',
    },
  });
  const cat2 = await prisma.category.create({
    data: { tenantId: tenant2.id, name: 'Cafetería', sortOrder: 1 },
  });
  const products2 = [
    { name: 'Café americano', price: 12 },
    { name: 'Capuchino',      price: 18 },
    { name: 'Medialuna',      price:  8 },
    { name: 'Sándwich',       price: 25 },
  ].map((p) => ({ id: randomUUID(), ...p }));
  await prisma.product.createMany({
    data: products2.map((p) => ({
      id: p.id, tenantId: tenant2.id, categoryId: cat2.id, name: p.name, price: p.price,
    })),
  });

  // Unos pocos pedidos de hoy, para que sus reportes no salgan vacíos.
  let orders2 = 0;
  for (let i = 0; i < 8; i++) {
    const p = pick(products2);
    const quantity = rand(1, 2);
    const total = money(p.price * quantity);
    const createdAt = atBolivia(todayStr, rand(8, 19), rand(0, 59));
    // MONTHLY: la secuencia se lleva por mes (YYYY-MM), no por día.
    const [{ last_number: orderNumber }] = await prisma.$queryRaw<[{ last_number: number }]>`
      INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
      VALUES (${tenant2.id}, ${branch2.id}, ${todayStr.slice(0, 7)}, 1)
      ON CONFLICT (tenant_id, branch_id, period)
      DO UPDATE SET last_number = branch_order_sequences.last_number + 1
      RETURNING last_number`;
    await prisma.order.create({
      data: {
        tenantId: tenant2.id, branchId: branch2.id, orderNumber,
        type: OrderType.TAKEOUT, status: OrderStatus.DELIVERED,
        paymentMethod: PaymentMethod.CASH,
        subtotal: total, total, createdBy: owner2.id,
        createdAt, updatedAt: createdAt,
        items: {
          create: [{
            productId: p.id, productName: p.name, quantity,
            unitPrice: p.price, subtotal: total,
          }],
        },
        payments: { create: [{ tenantId: tenant2.id, method: PaymentMethod.CASH, amount: total }] },
      },
    });
    orders2++;
  }
  console.log(
    `Segundo tenant creado: ${tenant2.name} (plan BASICO, ` +
    `${products2.length} productos, ${orders2} pedidos)`,
  );

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n✓ Seed completado');
  console.log('──────────────────────────────────────────────');
  console.log('  Restaurante Demo (PRO, 2 sucursales, reset DAILY)');
  console.log('    OWNER:   owner@demo.com   / demo123');
  console.log('    CASHIER: cajero@demo.com  / demo123  (Principal)');
  console.log('    CASHIER: cajera2@demo.com / demo123  (Sucursal Norte)');
  console.log('');
  console.log('  Café del Centro (BASICO, 1 sucursal, reset MONTHLY)');
  console.log('    OWNER:   owner@cafe.com   / demo123');
  console.log('──────────────────────────────────────────────');
  console.log(`  Hoy (${todayStr}): Bs ${todaySales.toFixed(2)} vendidos en Restaurante Demo`);
  console.log('──────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
