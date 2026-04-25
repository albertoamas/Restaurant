/**
 * Seed script — datos para HamBurgos
 * Uso: pnpm --filter backend seed
 *
 * Credenciales:
 *   OWNER:   admin@hamburgos.com   / demo123
 *   CASHIER: cajero@hamburgos.com  / demo123
 *   Negocio: HamBurgos               (1 sucursal)
 */

import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env only in local development; in production vars come from Docker
if (process.env.NODE_ENV !== 'production') {
  const backendEnvPath = path.resolve(__dirname, '../.env');

  require('dotenv').config({ path: backendEnvPath });
}

const prisma = new PrismaClient();

// bcrypt hash de "demo123" con salt 10
const PASSWORD_HASH = '$2b$10$8oTvGty7u4u2obh4a0r9Leq529hbsloH60MXuIlDy6zQEvRwAiVTu';

async function seed() {
  console.log('Conectado a la base de datos');

  // ── Reset ────────────────────────────────────────────────────
  // Borrar tenant cascadea automáticamente a: users, branches, categories,
  // products, orders (→ items, payments), cashSessions (→ expenses),
  // customers y branchOrderSequences. No quedan huérfanos.
  console.log('Limpiando datos...');
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  // ── Planes (globales, sin tenant_id) ─────────────────────────
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
      },
      {
        id:             'PRO',
        displayName:    'Pro',
        priceBs:        399,
        maxBranches:    3,
        maxCashiers:    8,
        maxProducts:    -1,
        kitchenEnabled: true,
      },
      {
        id:             'NEGOCIO',
        displayName:    'Negocio',
        priceBs:        790,
        maxBranches:    -1,
        maxCashiers:    -1,
        maxProducts:    -1,
        kitchenEnabled: true,
      },
    ],
  });

  // ── Tenant ───────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name:                   'HamBurgos',
      slug:                   'hamburgos',
      plan:                   'BASICO',
      orderNumberResetPeriod: 'MONTHLY',
    },
  });
  console.log(`Tenant creado: HamBurgos (${tenant.id})`);

  // ── Sucursal ─────────────────────────────────────────────────
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name:     'HamBurgos',
    },
  });
  console.log('Sucursal creada: HamBurgos');

  // ── Owner ────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      email:        'admin@hamburgos.com',
      passwordHash: PASSWORD_HASH,
      name:         'Admin HamBurgos',
      role:         'OWNER',
    },
  });
  console.log('Usuario OWNER creado: admin@hamburgos.com / demo123');

  // ── Cajero ───────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      branchId:     branch.id,
      email:        'cajero@hamburgos.com',
      passwordHash: PASSWORD_HASH,
      name:         'Cajero Demo',
      role:         'CASHIER',
    },
  });
  console.log('Usuario CASHIER creado: cajero@hamburgos.com / demo123');

  // ── Categorías ───────────────────────────────────────────────
  const categoriesData = [
    { name: 'Hamburguesas', sortOrder: 1 },
    { name: 'HB',           sortOrder: 2 },
    { name: 'Extras',       sortOrder: 3 },
    { name: 'Bebidas',      sortOrder: 4 },
    { name: 'Combos',       sortOrder: 5 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: { tenantId: tenant.id, name: cat.name, sortOrder: cat.sortOrder },
    });
    categoryIds[cat.name] = created.id;
  }
  console.log(`Categorías creadas: ${categoriesData.map((c) => c.name).join(', ')}`);

  // ── Productos ────────────────────────────────────────────────
  const products = [
    // Hamburguesas
    { cat: 'Hamburguesas', name: 'HB Original',   price: 25 },
    { cat: 'Hamburguesas', name: 'HB Doble',       price: 35 },
    { cat: 'Hamburguesas', name: 'Desmechada',     price: 35 },
    { cat: 'Hamburguesas', name: '4 Quesos',       price: 50 },
    { cat: 'Hamburguesas', name: 'La XXX',         price: 50 },
    { cat: 'Hamburguesas', name: 'Big Mama',       price: 55 },

    // HB (sándwiches)
    { cat: 'HB', name: 'Lomito HB',    price: 35 },
    { cat: 'HB', name: 'Milanesa HB',  price: 35 },

    // Extras
    { cat: 'Extras', name: 'Jamón',                        price: 3  },
    { cat: 'Extras', name: 'Bacon',                        price: 5  },
    { cat: 'Extras', name: 'Huevo',                        price: 4  },
    { cat: 'Extras', name: 'Papas Fritas',                 price: 10 },
    { cat: 'Extras', name: 'Papas Fritas + Crispy Tocino', price: 15 },

    // Bebidas
    { cat: 'Bebidas', name: 'Gaseosa Mini',    price: 3  },
    { cat: 'Bebidas', name: 'Gaseosa Popular', price: 7  },
    { cat: 'Bebidas', name: 'Gaseosa Litro',   price: 10 },
    { cat: 'Bebidas', name: 'Soda 2 Litros',   price: 15 },
    { cat: 'Bebidas', name: 'Vaso Refresco',   price: 5  },
    { cat: 'Bebidas', name: 'Refresco',        price: 15 },
    { cat: 'Bebidas', name: 'Paceña 235ml',    price: 7  },
    { cat: 'Bebidas', name: 'Paceña Litro',    price: 25 },

    // Combos
    { cat: 'Combos', name: 'Dúo Original (2 Originales + gaseosa 500ml)',          price: 55  },
    { cat: 'Combos', name: 'Dúo Doble (2 Dobles + gaseosa 500ml)',                 price: 75  },
    { cat: 'Combos', name: 'Familiar Original (4 Originales + gaseosa 1L)',        price: 107 },
    { cat: 'Combos', name: 'Familiar Doble (4 Dobles + gaseosa 1L)',               price: 147 },
    { cat: 'Combos', name: 'Combo Loco (XXX + 4 Quesos + Big Mama + gaseosa 2L)', price: 167 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        tenantId:   tenant.id,
        categoryId: categoryIds[p.cat],
        name:       p.name,
        price:      p.price,
      },
    });
  }
  console.log(`Productos creados: ${products.length}`);

  console.log('\n✓ Seed completado');
  console.log('──────────────────────────────────────────────');
  console.log('  OWNER:   admin@hamburgos.com / demo123');
  console.log('  CASHIER: cajero@hamburgos.com    / demo123');
  console.log('  Negocio: HamBurgos (plan BASICO, reset MONTHLY)');
  console.log('──────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
