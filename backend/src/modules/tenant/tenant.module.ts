import { Module } from '@nestjs/common';
import { TenantRepository } from './infrastructure/persistence/tenant.repository';

@Module({
  providers: [
    {
      provide: 'TenantRepositoryPort',
      useClass: TenantRepository,
    },
  ],
  exports: ['TenantRepositoryPort'],
})
export class TenantModule {}
