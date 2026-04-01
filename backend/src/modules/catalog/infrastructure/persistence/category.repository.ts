import { Injectable } from '@nestjs/common';
import { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { Category as PrismaCategory } from '@prisma/client';

function toDomain(row: PrismaCategory): Category {
  return Category.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  });
}

@Injectable()
export class CategoryRepository implements CategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findById(id: string, tenantId: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });
    return row ? toDomain(row) : null;
  }

  async save(category: Category): Promise<Category> {
    const data = {
      id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };

    const row = await this.prisma.category.upsert({
      where: { id: category.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.category.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
  }
}
