import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';
import { EventsModule } from '../events/events.module';
import { AdminController } from './infrastructure/controllers/admin.controller';
import { ListTenantsUseCase } from './application/use-cases/list-tenants.use-case';
import { ToggleTenantActiveUseCase } from './application/use-cases/toggle-tenant-active.use-case';
import { UpdateTenantPlanUseCase } from './application/use-cases/update-tenant-plan.use-case';
import { UpdateTenantModulesUseCase } from './application/use-cases/update-tenant-modules.use-case';
import { ListPlansUseCase } from './application/use-cases/list-plans.use-case';
import { UpdatePlanLimitsUseCase } from './application/use-cases/update-plan-limits.use-case';

@Module({
  imports: [TenantModule, AuthModule, PlansModule, EventsModule],
  controllers: [AdminController],
  providers: [
    ListTenantsUseCase,
    ToggleTenantActiveUseCase,
    UpdateTenantPlanUseCase,
    UpdateTenantModulesUseCase,
    ListPlansUseCase,
    UpdatePlanLimitsUseCase,
  ],
})
export class AdminModule {}
