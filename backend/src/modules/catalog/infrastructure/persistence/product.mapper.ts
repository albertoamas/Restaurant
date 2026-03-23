import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from './product.orm-entity';

export class ProductMapper {
  static toDomain(orm: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: orm.id,
      tenantId: orm.tenantId,
      categoryId: orm.categoryId,
      name: orm.name,
      price: Number(orm.price),
      imageUrl: orm.imageUrl,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: Product): ProductOrmEntity {
    const orm = new ProductOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.categoryId = domain.categoryId;
    orm.name = domain.name;
    orm.price = domain.price;
    orm.imageUrl = domain.imageUrl;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}
