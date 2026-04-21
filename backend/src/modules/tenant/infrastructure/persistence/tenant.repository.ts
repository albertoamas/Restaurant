import { Injectable, NotFoundException } from '@nestjs/common';
import { Tenant, TenantModules, TenantSettings } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort, TenantWithOwner } from '../../domain/ports/tenant-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { Tenant as PrismaTenant } from '@prisma/client';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';

function toDomain(row: PrismaTenant): Tenant {
  return new Tenant(
    row.id,
    row.name,
    row.slug,
    row.isActive,
    row.createdAt,
    (row.plan as SaasPlan) ?? SaasPlan.BASICO,
    row.ordersEnabled,
    row.cashEnabled,
    row.teamEnabled,
    row.branchesEnabled,
    row.kitchenEnabled,
    row.rafflesEnabled,
    (row.orderNumberResetPeriod as OrderNumberResetPeriod) ?? OrderNumberResetPeriod.DAILY,
    row.logoUrl         ?? null,
    row.businessAddress ?? null,
    row.businessPhone   ?? null,
    row.receiptSlogan   ?? null,
  );
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
    const data = {
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
      orderNumberResetPeriod:  tenant.orderNumberResetPeriod,
      logoUrl:                 tenant.logoUrl,
      businessAddress:         tenant.businessAddress,
      businessPhone:           tenant.businessPhone,
      receiptSlogan:           tenant.receiptSlogan,
    };

    const row = await this.prisma.tenant.upsert({
      where:  { id: tenant.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }

  async findAll(): Promise<TenantWithOwner[]> {
    const rows = await this.prisma.tenant.findMany({
      include: {
        users: {
          where:  { role: 'OWNER' },
          select: { name: true, email: true },
          take:   1,
        },
        _count: {
          select: {
            branches: true,
            users:    { where: { role: 'CASHIER' } },
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
      modules: {
        ordersEnabled:   r.ordersEnabled,
        cashEnabled:     r.cashEnabled,
        teamEnabled:     r.teamEnabled,
        branchesEnabled: r.branchesEnabled,
        kitchenEnabled:  r.kitchenEnabled,
        rafflesEnabled:  r.rafflesEnabled,
      },
      settings: {
        orderNumberResetPeriod: (r.orderNumberResetPeriod as OrderNumberResetPeriod) ?? OrderNumberResetPeriod.DAILY,
        logoUrl:         r.logoUrl         ?? null,
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

  async updateModules(id: string, modules: Partial<TenantModules>): Promise<Tenant> {
    const current = await this.prisma.tenant.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Tenant ${id} not found`);

    const row = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(modules.ordersEnabled   !== undefined && { ordersEnabled:   modules.ordersEnabled }),
        ...(modules.cashEnabled     !== undefined && { cashEnabled:     modules.cashEnabled }),
        ...(modules.teamEnabled     !== undefined && { teamEnabled:     modules.teamEnabled }),
        ...(modules.branchesEnabled !== undefined && { branchesEnabled: modules.branchesEnabled }),
        ...(modules.kitchenEnabled  !== undefined && { kitchenEnabled:  modules.kitchenEnabled }),
        ...(modules.rafflesEnabled  !== undefined && { rafflesEnabled:  modules.rafflesEnabled }),
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
        ...(settings.logoUrl         !== undefined && { logoUrl:         settings.logoUrl }),
        ...(settings.businessAddress !== undefined && { businessAddress: settings.businessAddress }),
        ...(settings.businessPhone   !== undefined && { businessPhone:   settings.businessPhone }),
        ...(settings.receiptSlogan   !== undefined && { receiptSlogan:   settings.receiptSlogan }),
      },
    });
    return toDomain(row);
  }
}
