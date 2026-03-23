import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UserMapper } from './user.mapper';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const orm = await this.repo.findOne({
      where: { tenant_id: tenantId, email },
    });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async save(user: User): Promise<User> {
    const orm = UserMapper.toOrm(user);
    const saved = await this.repo.save(orm);
    return UserMapper.toDomain(saved);
  }
}
