import { Module } from '@nestjs/common';
import { TenantRepository } from './infrastructure/persistence/tenant.repository';
import { TenantController } from './infrastructure/controllers/tenant.controller';
import { UpdateTenantSettingsUseCase } from './application/use-cases/update-tenant-settings.use-case';

@Module({
  controllers: [TenantController],
  providers: [
    { provide: 'TenantRepositoryPort', useClass: TenantRepository },
    UpdateTenantSettingsUseCase,
  ],
  exports: ['TenantRepositoryPort'],
})
export class TenantModule {}
