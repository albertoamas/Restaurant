/**
 * Seed de prueba — Sorteo acumulativo con 500 clientes
 *
 * Uso: pnpm --filter backend seed:raffle
 *
 * Crea un sorteo SPENDING_THRESHOLD (umbral 100 Bs) con 500 clientes
 * distribuidos en 5 perfiles de gasto. Los tickets y acumulados se insertan
 * directamente sin pasar por la API (script de prueba, no producción).
 *
 * Distribución de clientes:
 *   100 × sin ticket    (10–99 Bs)
 *   180 × 1 ticket     (100–199 Bs)
 *   120 × 2–3 tickets  (200–399 Bs)
 *    70 × 4–6 tickets  (400–699 Bs)
 *    30 × 7–12 tickets (700–1200 Bs)
 */

import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const prisma = new PrismaClient();

// ─── Nombres bolivianos ───────────────────────────────────────────────────────

const FIRST_NAMES = [
  'María', 'Ana', 'Carmen', 'Rosa', 'Lucía', 'Patricia', 'Sandra', 'Verónica',
  'Claudia', 'Silvia', 'Gabriela', 'Mónica', 'Elena', 'Natalia', 'Alejandra',
  'Carlos', 'Jorge', 'Juan', 'Luis', 'Miguel', 'Roberto', 'Fernando', 'Ricardo',
  'Marco', 'Pablo', 'Eduardo', 'Daniel', 'Sergio', 'Rodrigo', 'Alejandro',
  'Paola', 'Valeria', 'Fernanda', 'Daniela', 'Camila', 'Sofía', 'Andrea',
  'José', 'David', 'Diego', 'Andrés', 'Cristian', 'Víctor', 'Óscar', 'Raúl',
];

const LAST_NAMES = [
  'Mamani', 'Quispe', 'Condori', 'Choque', 'Flores', 'García', 'López', 'Rojas',
  'Vargas', 'Morales', 'Paz', 'Aliaga', 'Tarqui', 'Huanca', 'Copa', 'Ticona',
  'Apaza', 'Calisaya', 'Laime', 'Colque', 'Poma', 'Vásquez', 'Salinas', 'Cruz',
  'Romero', 'Mendoza', 'Torres', 'Herrera', 'Aguilar', 'Ramos', 'Castro', 'Soto',
  'Orellana', 'Cárdenas', 'Medina', 'Pereira', 'Gutiérrez', 'Molina', 'Reyes', 'Navia',
];

// ─── Perfiles de gasto ────────────────────────────────────────────────────────

interface Profile {
  minSpent: number;
  maxSpent: number;
  count:    number;
}

const PROFILES: Profile[] = [
  { minSpent:   10, maxSpent:   99, count: 100 }, // 0 tickets
  { minSpent:  100, maxSpent:  199, count: 180 }, // 1 ticket
  { minSpent:  200, maxSpent:  399, count: 120 }, // 2-3 tickets
  { minSpent:  400, maxSpent:  699, count:  70 }, // 4-6 tickets
  { minSpent:  700, maxSpent: 1200, count:  30 }, // 7-12 tickets
];

// ─── Utilidades ───────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName(index: number): { name: string; phone: string } {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last1 = LAST_NAMES[(index * 3)     % LAST_NAMES.length];
  const last2 = LAST_NAMES[(index * 7 + 5) % LAST_NAMES.length];
  // Teléfono determinista (garantiza unicidad, no choca con clientes reales)
  const phone = `TEST-${String(index).padStart(5, '0')}`;
  return { name: `${first} ${last1} ${last2}`, phone };
}

/** Fecha aleatoria dentro del rango del sorteo (1 abril – 2 mayo 2026) */
function randomDate(raffleStart: Date, now: Date): Date {
  const rangeMs = now.getTime() - raffleStart.getTime();
  return new Date(raffleStart.getTime() + Math.random() * rangeMs);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedRaffle() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ABORTADO: seed no puede ejecutarse en NODE_ENV=production');
    process.exit(1);
  }

  // Buscar tenant: primero 'demo', si no existe usa el primero disponible
  const tenant =
    (await prisma.tenant.findUnique({ where: { slug: 'demo' } })) ??
    (await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!tenant) {
    console.error('❌ No hay tenants en la BD. Ejecuta primero: pnpm --filter backend seed');
    process.exit(1);
  }

  // Limpiar sorteo anterior de prueba para poder re-ejecutar sin duplicados
  const existingRaffle = await prisma.raffle.findFirst({
    where: { tenantId: tenant.id, name: 'Sorteo Prueba Mayo 2026' },
  });
  if (existingRaffle) {
    console.log('Eliminando sorteo de prueba anterior...');
    await prisma.raffle.delete({ where: { id: existingRaffle.id } });
  }

  // Limpiar clientes de prueba anteriores
  await prisma.customer.deleteMany({
    where: { tenantId: tenant.id, email: { startsWith: 'prueba-' } },
  });

  console.log(`Tenant encontrado: ${tenant.name} (${tenant.id})`);

  // ── Crear el sorteo ──────────────────────────────────────────────────────────
  const RAFFLE_START = new Date('2026-04-01T00:00:00-04:00'); // Bolivia UTC-4
  const NOW          = new Date('2026-05-02T12:00:00-04:00');
  const THRESHOLD    = 100;

  const raffle = await prisma.raffle.create({
    data: {
      tenantId:         tenant.id,
      name:             'Sorteo Prueba Mayo 2026',
      description:      'Sorteo de prueba con 500 clientes para demostración',
      status:           'ACTIVE',
      ticketMode:       'SPENDING_THRESHOLD',
      spendingThreshold: THRESHOLD,
      numberOfWinners:  3,
      createdAt:        RAFFLE_START,
      prizes: {
        create: [
          { id: randomUUID(), position: 1, prizeDescription: 'Smart TV 55"' },
          { id: randomUUID(), position: 2, prizeDescription: 'Microondas' },
          { id: randomUUID(), position: 3, prizeDescription: 'Vale de Bs 200' },
        ],
      },
    },
  });
  console.log(`Sorteo creado: ${raffle.name} (${raffle.id})`);

  // ── Crear clientes, spending y tickets ───────────────────────────────────────
  let ticketCounter = 0;
  let totalCustomers = 0;

  for (const profile of PROFILES) {
    const customerData: {
      id: string; tenantId: string; name: string; phone: string; email: string;
    }[] = [];
    const spendingData: {
      id: string; tenantId: string; raffleId: string; customerId: string; totalSpent: number;
    }[] = [];
    const ticketData: {
      id: string; tenantId: string; raffleId: string; customerId: string;
      ticketNumber: number; createdAt: Date;
    }[] = [];

    for (let i = 0; i < profile.count; i++) {
      const globalIndex = totalCustomers + i;
      const { name, phone } = randomName(globalIndex);
      const customerId = randomUUID();
      const totalSpent = randInt(profile.minSpent, profile.maxSpent);
      const ticketsEarned = Math.floor(totalSpent / THRESHOLD);

      customerData.push({
        id:       customerId,
        tenantId: tenant.id,
        name,
        phone,
        email:    `prueba-${globalIndex}@test.com`,
      });

      spendingData.push({
        id:         randomUUID(),
        tenantId:   tenant.id,
        raffleId:   raffle.id,
        customerId,
        totalSpent,
      });

      for (let t = 0; t < ticketsEarned; t++) {
        ticketCounter++;
        ticketData.push({
          id:           randomUUID(),
          tenantId:     tenant.id,
          raffleId:     raffle.id,
          customerId,
          ticketNumber: ticketCounter,
          createdAt:    randomDate(RAFFLE_START, NOW),
        });
      }
    }

    await prisma.customer.createMany({ data: customerData });
    await prisma.customerRaffleSpending.createMany({ data: spendingData });
    if (ticketData.length) {
      await prisma.raffleTicket.createMany({ data: ticketData });
    }

    const tickets0 = profile.minSpent < THRESHOLD ? profile.count : 0;
    const label = profile.minSpent < THRESHOLD
      ? `0 tickets (${profile.minSpent}–${profile.maxSpent} Bs)`
      : `${Math.floor(profile.minSpent / THRESHOLD)}–${Math.floor(profile.maxSpent / THRESHOLD)} tickets (${profile.minSpent}–${profile.maxSpent} Bs)`;
    console.log(`  ${profile.count} clientes × ${label}${tickets0 > 0 ? ' — no alcanzaron el umbral' : ''}`);

    totalCustomers += profile.count;
  }

  console.log('\n✓ Seed de sorteo completado');
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`  Sorteo:    ${raffle.name}`);
  console.log(`  Clientes:  ${totalCustomers}`);
  console.log(`  Tickets:   ${ticketCounter}`);
  console.log(`  Umbral:    Bs ${THRESHOLD} por ticket`);
  console.log(`  Período:   1 abril 2026 → 2 mayo 2026`);
  console.log('──────────────────────────────────────────────────────────────');
}

seedRaffle()
  .catch((err) => {
    console.error('Error en seed-raffle:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
