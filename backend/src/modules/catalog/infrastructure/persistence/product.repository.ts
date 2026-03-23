import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from './product.orm-entity';
import { ProductMapper } from './product.mapper';

@Injectable()
export class ProductRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findAllByTenant(tenantId: string, categoryId?: string): Promise<Product[]> {
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (categoryId) {
      where.categoryId = categoryId;
    }
    const rows = await this.repo.find({ where });
    return rows.map(ProductMapper.toDomain);
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? ProductMapper.toDomain(row) : null;
  }

  async findByIds(ids: string[], tenantId: string): Promise<Product[]> {
    const rows = await this.repo.find({
      where: { id: In(ids), tenantId },
    });
    return rows.map(ProductMapper.toDomain);
  }

  async save(product: Product): Promise<Product> {
    const orm = ProductMapper.toOrm(product);
    const saved = await this.repo.save(orm);
    return ProductMapper.toDomain(saved);
  }
}
