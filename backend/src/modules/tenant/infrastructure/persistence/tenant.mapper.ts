import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantOrmEntity } from './tenant.orm-entity';

export class TenantMapper {
  static toDomain(orm: TenantOrmEntity): Tenant {
    return new Tenant(orm.id, orm.name, orm.slug, orm.isActive, orm.createdAt);
  }

  static toOrm(domain: Tenant): TenantOrmEntity {
    const orm = new TenantOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.slug = domain.slug;
    orm.isActive = domain.isActive;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}
