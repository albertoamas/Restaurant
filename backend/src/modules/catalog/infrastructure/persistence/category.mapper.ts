import { Category } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from './category.orm-entity';

export class CategoryMapper {
  static toDomain(orm: CategoryOrmEntity): Category {
    return Category.reconstitute({
      id: orm.id,
      tenantId: orm.tenantId,
      name: orm.name,
      sortOrder: orm.sortOrder,
      isActive: orm.isActive,
    });
  }

  static toOrm(domain: Category): CategoryOrmEntity {
    const orm = new CategoryOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.name = domain.name;
    orm.sortOrder = domain.sortOrder;
    orm.isActive = domain.isActive;
    return orm;
  }
}
