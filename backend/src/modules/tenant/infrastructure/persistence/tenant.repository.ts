import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantRepositoryPort } from '../../domain/ports/tenant-repository.port';
import { TenantMapper } from './tenant.mapper';
import { TenantOrmEntity } from './tenant.orm-entity';

@Injectable()
export class TenantRepository implements TenantRepositoryPort {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly repo: Repository<TenantOrmEntity>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? TenantMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const orm = await this.repo.findOne({ where: { slug } });
    return orm ? TenantMapper.toDomain(orm) : null;
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const orm = TenantMapper.toOrm(tenant);
    const saved = await this.repo.save(orm);
    return TenantMapper.toDomain(saved);
  }
}
