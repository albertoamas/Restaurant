import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';
import { UploadModule } from '../upload/upload.module';
import { EventsModule } from '../events/events.module';
import { BranchModule } from '../branch/branch.module';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminController } from './infrastructure/controllers/admin.controller';
import { ListTenantsUseCase } from './application/use-cases/list-tenants.use-case';
import { ToggleTenantActiveUseCase } from './application/use-cases/toggle-tenant-active.use-case';
import { UpdateTenantPlanUseCase } from './application/use-cases/update-tenant-plan.use-case';
import { UpdateTenantModulesUseCase } from './application/use-cases/update-tenant-modules.use-case';
import { ListPlansUseCase } from './application/use-cases/list-plans.use-case';
import { UpdatePlanLimitsUseCase } from './application/use-cases/update-plan-limits.use-case';
import { ResetUserPasswordAdminUseCase } from './application/use-cases/reset-user-password-admin.use-case';
import { GetTenantHealthUseCase } from './application/use-cases/get-tenant-health.use-case';

@Module({
  imports: [TenantModule, AuthModule, PlansModule, EventsModule, BranchModule, CatalogModule, UploadModule],
  controllers: [AdminController],
  providers: [
    ListTenantsUseCase,
    ToggleTenantActiveUseCase,
    UpdateTenantPlanUseCase,
    UpdateTenantModulesUseCase,
    ListPlansUseCase,
    UpdatePlanLimitsUseCase,
    ResetUserPasswordAdminUseCase,
    GetTenantHealthUseCase,
  ],
})
export class AdminModule {}
