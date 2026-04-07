import { Module } from '@nestjs/common';
import { TenantRepository } from './infrastructure/persistence/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';

@Module({
  controllers: [TenantController],
  providers: [
    {
      provide: 'TenantRepositoryPort',
      useClass: TenantRepository,
    },
  ],
  exports: ['TenantRepositoryPort'],
})
export class TenantModule {}
