import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    const user = new User();
    user.id = orm.id;
    user.tenantId = orm.tenant_id;
    user.email = orm.email;
    user.passwordHash = orm.password_hash;
    user.name = orm.name;
    user.role = orm.role;
    user.isActive = orm.is_active;
    user.createdAt = orm.created_at;
    return user;
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.tenant_id = domain.tenantId;
    orm.email = domain.email;
    orm.password_hash = domain.passwordHash;
    orm.name = domain.name;
    orm.role = domain.role;
    orm.is_active = domain.isActive;
    orm.created_at = domain.createdAt;
    return orm;
  }
}
