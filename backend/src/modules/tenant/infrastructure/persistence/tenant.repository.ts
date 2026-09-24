import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Tenant, TenantModules, TenantSettings } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort, TenantWithOwner, NewOwnerProps } from '../../domain/ports/tenant-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Tenant as PrismaTenant } from '@prisma/client';
import { OrderNumberResetPeriod, SaasPlan, UserRole } from '@pos/shared';

function toDomain(row: PrismaTenant): Tenant {
  return Tenant.reconstitute({
    id:        row.id,
    name:      row.name,
    slug:      row.slug,
    isActive:  row.isActive,
    createdAt: row.createdAt,
    plan:      (row.plan as SaasPlan) ?? SaasPlan.BASICO,
    modules: {
      ordersEnabled:          row.ordersEnabled,
      cashEnabled:            row.cashEnabled,
      teamEnabled:            row.teamEnabled,
      branchesEnabled:        row.branchesEnabled,
      kitchenEnabled:         row.kitchenEnabled,
      rafflesEnabled:         row.rafflesEnabled,
      advancedReportsEnabled: row.advancedReportsEnabled,
    },
    orderNumberResetPeriod: (row.orderNumberResetPeriod as OrderNumberResetPeriod) ?? OrderNumberResetPeriod.DAILY,
    businessAddress: row.businessAddress,
    businessPhone:   row.businessPhone,
    receiptSlogan:   row.receiptSlogan,
    moduleOverrides: row.moduleOverrides as Partial<TenantModules> | null,
  });
}


/**
 * Mapeo inverso de `toDomain`. Vive acá para que `save` y `createTenantWithOwner`
 * no lo repitan: una columna nueva en Tenant se agrega en un solo lugar.
 */
function toPrismaData(tenant: Tenant) {
  return {
    id:                      tenant.id,
    name:                    tenant.name,
    slug:                    tenant.slug,
    isActive:                tenant.isActive,
    createdAt:               tenant.createdAt,
    plan:                    tenant.plan,
    ordersEnabled:           tenant.ordersEnabled,
    cashEnabled:             tenant.cashEnabled,
    teamEnabled:             tenant.teamEnabled,
    branchesEnabled:         tenant.branchesEnabled,
    kitchenEnabled:          tenant.kitchenEnabled,
    rafflesEnabled:          tenant.rafflesEnabled,
    advancedReportsEnabled:  tenant.advancedReportsEnabled,
    orderNumberResetPeriod:  tenant.orderNumberResetPeriod,
    businessAddress:         tenant.businessAddress,
    businessPhone:           tenant.businessPhone,
    receiptSlogan:           tenant.receiptSlogan,
    // `null` limpia la columna; Prisma.DbNull es el null de JSON en Postgres.
    moduleOverrides:         tenant.moduleOverrides ?? Prisma.DbNull,
  };
}

@Injectable()
export class TenantRepository implements TenantRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { slug } });
    return row ? toDomain(row) : null;
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const data = toPrismaData(tenant);

    const row = await this.prisma.tenant.upsert({
      where:  { id: tenant.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }

  async createTenantWithOwner(tenant: Tenant, owner: NewOwnerProps, branchName: string): Promise<Tenant> {
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({ data: toPrismaData(tenant) });

      await tx.user.create({
        data: {
          id:           owner.id,
          tenantId:     tenant.id,
          email:        owner.email,
          passwordHash: owner.passwordHash,
          name:         owner.name,
          role:         UserRole.OWNER,
        },
      });

      // Sin esta sucursal el dueño entra a un negocio sin dónde vender: "Sin
      // sucursales", sin caja, sin POS. La crea la propia transacción de alta,
      // no un paso manual posterior.
      await tx.branch.create({
        data: {
          id:       uuidv4(),
          tenantId: tenant.id,
          name:     branchName,
        },
      });

      return created;
    });

    return toDomain(row);
  }

  async findByPlan(plan: SaasPlan): Promise<Tenant[]> {
    const rows = await this.prisma.tenant.findMany({ where: { plan } });
    return rows.map(toDomain);
  }

  async findAll(): Promise<TenantWithOwner[]> {
    const rows = await this.prisma.tenant.findMany({
      include: {
        users: {
          where:  { role: 'OWNER' },
          select: { id: true, name: true, email: true },
          take:   1,
        },
        // Los tres contadores cuentan solo filas activas, igual que
        // PlanLimitService al hacer cumplir el límite: si no, el panel pinta
        // "excedido" a un tenant que en realidad tiene cupo libre.
        _count: {
          select: {
            branches: { where: { isActive: true } },
            users:    { where: { role: 'CASHIER', isActive: true } },
            products: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id:           r.id,
      name:         r.name,
      slug:         r.slug,
      isActive:     r.isActive,
      createdAt:    r.createdAt,
      plan:         (r.plan as SaasPlan) ?? SaasPlan.BASICO,
      owner:        r.users[0] ?? null,
      branchCount:  r._count.branches,
      cashierCount: r._count.users,
      productCount: r._count.products,
      modules: {
        ordersEnabled:   r.ordersEnabled,
        cashEnabled:     r.cashEnabled,
        teamEnabled:     r.teamEnabled,
        branchesEnabled: r.branchesEnabled,
        kitchenEnabled:  r.kitchenEnabled,
        rafflesEnabled:  r.rafflesEnabled,
        advancedReportsEnabled: r.advancedReportsEnabled,
      },
      settings: {
        orderNumberResetPeriod: (r.orderNumberResetPeriod as OrderNumberResetPeriod) ?? OrderNumberResetPeriod.DAILY,
        businessAddress: r.businessAddress ?? null,
        businessPhone:   r.businessPhone   ?? null,
        receiptSlogan:   r.receiptSlogan   ?? null,
      },
    }));
  }

  async updatePlan(id: string, plan: SaasPlan): Promise<Tenant> {
    const current = await this.prisma.tenant.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Tenant ${id} not found`);
    const row = await this.prisma.tenant.update({ where: { id }, data: { plan } });
    return toDomain(row);
  }

  async toggleActive(id: string): Promise<Tenant> {
    const current = await this.prisma.tenant.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Tenant ${id} not found`);

    const row = await this.prisma.tenant.update({
      where: { id },
      data:  { isActive: !current.isActive },
    });
    return toDomain(row);
  }

  async applyModules(
    id: string,
    modules: TenantModules,
    overrides: Partial<TenantModules> | null,
  ): Promise<Tenant> {
    const current = await this.prisma.tenant.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Tenant ${id} not found`);

    const row = await this.prisma.tenant.update({
      where: { id },
      data: {
        ordersEnabled:   modules.ordersEnabled,
        cashEnabled:     modules.cashEnabled,
        teamEnabled:     modules.teamEnabled,
        branchesEnabled: modules.branchesEnabled,
        kitchenEnabled:  modules.kitchenEnabled,
        rafflesEnabled:  modules.rafflesEnabled,
        advancedReportsEnabled: modules.advancedReportsEnabled,
        moduleOverrides: overrides && Object.keys(overrides).length > 0 ? overrides : Prisma.DbNull,
      },
    });
    return toDomain(row);
  }

  async updateSettings(id: string, settings: Partial<TenantSettings>): Promise<Tenant> {
    const current = await this.prisma.tenant.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Tenant ${id} not found`);

    const row = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(settings.orderNumberResetPeriod !== undefined && {
          orderNumberResetPeriod: settings.orderNumberResetPeriod,
        }),
        ...(settings.businessAddress !== undefined && { businessAddress: settings.businessAddress }),
        ...(settings.businessPhone   !== undefined && { businessPhone:   settings.businessPhone }),
        ...(settings.receiptSlogan   !== undefined && { receiptSlogan:   settings.receiptSlogan }),
      },
    });
    return toDomain(row);
  }
}
