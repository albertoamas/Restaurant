import { Injectable, NotFoundException } from '@nestjs/common';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort, TenantWithOwner } from '../../domain/ports/tenant-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { Tenant as PrismaTenant } from '@prisma/client';

function toDomain(row: PrismaTenant): Tenant {
  return new Tenant(row.id, row.name, row.slug, row.isActive, row.createdAt);
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
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
    };

    const row = await this.prisma.tenant.upsert({
      where: { id: tenant.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }

  async findAll(): Promise<TenantWithOwner[]> {
    const rows = await this.prisma.tenant.findMany({
      include: {
        users: {
          where: { role: 'OWNER' },
          select: { name: true, email: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isActive: r.isActive,
      createdAt: r.createdAt,
      owner: r.users[0] ?? null,
    }));
  }

  async toggleActive(id: string): Promise<Tenant> {
    const current = await this.prisma.tenant.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`Tenant ${id} not found`);

    const row = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
    return toDomain(row);
  }
}
