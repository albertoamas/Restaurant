import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from './category.orm-entity';
import { CategoryMapper } from './category.mapper';

@Injectable()
export class CategoryRepository implements CategoryRepositoryPort {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repo: Repository<CategoryOrmEntity>,
  ) {}

  async findAllByTenant(tenantId: string): Promise<Category[]> {
    const rows = await this.repo.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
    return rows.map(CategoryMapper.toDomain);
  }

  async findById(id: string, tenantId: string): Promise<Category | null> {
    const row = await this.repo.findOne({ where: { id, tenantId } });
    return row ? CategoryMapper.toDomain(row) : null;
  }

  async save(category: Category): Promise<Category> {
    const orm = CategoryMapper.toOrm(category);
    const saved = await this.repo.save(orm);
    return CategoryMapper.toDomain(saved);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.repo.update({ id, tenantId }, { isActive: false });
  }
}
