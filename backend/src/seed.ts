/**
 * Seed script — datos para HamBurgos
 * Uso: pnpm --filter backend seed
 *
 * Credenciales:
 *   OWNER:   jimmy@hamburgos.com  / demo123
 *   Negocio: HamBurgos            (1 sucursal)
 */

import * as path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env only in local development; in production vars come from Docker
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

const prisma = new PrismaClient();

// bcrypt hash de "demo123" con salt 10
const PASSWORD_HASH = '$2b$10$8oTvGty7u4u2obh4a0r9Leq529hbsloH60MXuIlDy6zQEvRwAiVTu';

async function seed() {
  console.log('Conectado a la base de datos');

  // ── Reset ────────────────────────────────────────────────────
  console.log('Limpiando tablas...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cashSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.tenant.deleteMany();

  // ── Tenant ───────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name: 'HamBurgos',
      slug: 'hamburgos',
    },
  });
  console.log(`Tenant creado: HamBurgos (${tenant.id})`);

  // ── Sucursales ───────────────────────────────────────────────
  await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'HamBurgos',
    },
  });
  console.log('Sucursal creada: HamBurgos');

  // ── Owner ────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'jimmy@hamburgos.com',
      passwordHash: PASSWORD_HASH,
      name: 'Jimmy Burgos Romero',
      role: 'OWNER',
    },
  });
  console.log('Usuario OWNER creado: jimmy@hamburgos.com / demo123');

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
    { cat: 'Extras', name: 'Jamón',                       price: 3  },
    { cat: 'Extras', name: 'Bacon',                       price: 5  },
    { cat: 'Extras', name: 'Huevo',                       price: 4  },
    { cat: 'Extras', name: 'Papas Fritas',                price: 10 },
    { cat: 'Extras', name: 'Papas Fritas + Crispy Tocino', price: 15 },

    // Bebidas
    { cat: 'Bebidas', name: 'Gaseosa Mini',        price: 3  },
    { cat: 'Bebidas', name: 'Gaseosa Popular',     price: 7  },
    { cat: 'Bebidas', name: 'Gaseosa Litro',       price: 10 },
    { cat: 'Bebidas', name: 'Soda 2 Litros',       price: 15 },
    { cat: 'Bebidas', name: 'Vaso Refresco',       price: 5  },
    { cat: 'Bebidas', name: 'Refresco',            price: 15 },
    { cat: 'Bebidas', name: 'Paceña 235ml',        price: 7  },
    { cat: 'Bebidas', name: 'Paceña Litro',        price: 25 },

    // Combos
    { cat: 'Combos', name: 'Dúo Original (2 Originales + gaseosa 500ml)',         price: 55  },
    { cat: 'Combos', name: 'Dúo Doble (2 Dobles + gaseosa 500ml)',                price: 75  },
    { cat: 'Combos', name: 'Familiar Original (4 Originales + gaseosa 1L)',       price: 107 },
    { cat: 'Combos', name: 'Familiar Doble (4 Dobles + gaseosa 1L)',              price: 147 },
    { cat: 'Combos', name: 'Combo Loco (XXX + 4 Quesos + Big Mama + gaseosa 2L)', price: 167 },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: categoryIds[p.cat],
        name: p.name,
        price: p.price,
      },
    });
  }
  console.log(`Productos creados: ${products.length}`);

  console.log('\n✓ Seed completado');
  console.log('──────────────────────────────────────────────');
  console.log('  OWNER:   jimmy@hamburgos.com / demo123');
  console.log('  Negocio: HamBurgos');
  console.log('──────────────────────────────────────────────');
}

seed()
  .catch((err) => {
    console.error('Error en seed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
