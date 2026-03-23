import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmEntity } from './infrastructure/persistence/tenant.orm-entity';
import { TenantRepository } from './infrastructure/persistence/tenant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TenantOrmEntity])],
  providers: [
    {
      provide: 'TenantRepositoryPort',
      useClass: TenantRepository,
    },
  ],
  exports: ['TenantRepositoryPort'],
})
export class TenantModule {}
