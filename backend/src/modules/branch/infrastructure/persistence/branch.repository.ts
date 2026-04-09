import { Injectable } from '@nestjs/common';
import { Branch } from '../../domain/entities/branch.entity';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { Branch as PrismaBranch } from '@prisma/client';

function toDomain(row: PrismaBranch): Branch {
  return Branch.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    address: row.address,
    phone: row.phone,
    isActive: row.isActive,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class BranchRepository implements BranchRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Branch | null> {
    const row = await this.prisma.branch.findFirst({
      where: { id, tenantId },
    });
    return row ? toDomain(row) : null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.prisma.branch.count({ where: { tenantId } });
  }

  async findAllByTenant(tenantId: string): Promise<Branch[]> {
    const rows = await this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDomain);
  }

  async save(branch: Branch): Promise<Branch> {
    const data = {
      id: branch.id,
      tenantId: branch.tenantId,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      isActive: branch.isActive,
      createdAt: branch.createdAt,
    };

    const row = await this.prisma.branch.upsert({
      where: { id: branch.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }
}
