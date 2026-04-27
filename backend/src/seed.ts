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

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const prisma = new PrismaClient();

// bcrypt hash de "demo123" con salt 10
const PASSWORD_HASH = '$2b$10$8oTvGty7u4u2obh4a0r9Leq529hbsloH60MXuIlDy6zQEvRwAiVTu';

async function seed() {
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
  await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      email:        'owner@demo.com',
      passwordHash: PASSWORD_HASH,
      name:         'Administrador',
      role:         'OWNER',
    },
  });

  await prisma.user.create({
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

  for (const p of products) {
    await prisma.product.create({
      data: {
        tenantId:   tenant.id,
        categoryId: catId[p.cat],
        name:       p.name,
        price:      p.price,
      },
    });
  }
  console.log(`Productos creados: ${products.length}`);

  console.log('\n✓ Seed completado');
  console.log('──────────────────────────────────────────────');
  console.log('  OWNER:   owner@demo.com  / demo123');
  console.log('  CASHIER: cajero@demo.com / demo123');
  console.log('  Negocio: Restaurante Demo (plan PRO, reset DAILY)');
  console.log('──────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
