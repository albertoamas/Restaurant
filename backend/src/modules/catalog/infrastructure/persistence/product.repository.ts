import { Injectable } from '@nestjs/common';
import { ProductPage, ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { PrismaService } from '../../../prisma/prisma.service';
import { Product as PrismaProduct } from '@prisma/client';

function toDomain(row: PrismaProduct): Product {
  return Product.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    categoryId: row.categoryId,
    name: row.name,
    price: Number(row.price),
    imageUrl: row.imageUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByTenant(tenantId: string, categoryId?: string, includeInactive = false, page = 1, limit = 100): Promise<ProductPage> {
    const safeLimit = Math.min(limit, 200);
    const skip = (page - 1) * safeLimit;
    const where = {
      tenantId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(categoryId ? { categoryId } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        skip,
        take: safeLimit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data: rows.map(toDomain), total };
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const row = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });
    return row ? toDomain(row) : null;
  }

  async findByIds(ids: string[], tenantId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids }, tenantId },
    });
    return rows.map(toDomain);
  }

  async save(product: Product): Promise<Product> {
    const data = {
      id: product.id,
      tenantId: product.tenantId,
      categoryId: product.categoryId,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      createdAt: product.createdAt,
    };

    const row = await this.prisma.product.upsert({
      where: { id: product.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }
}
