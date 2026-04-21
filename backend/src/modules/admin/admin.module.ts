import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { AuthModule } from '../auth/auth.module';
import { PlansModule } from '../plans/plans.module';
import { EventsModule } from '../events/events.module';
import { AdminController } from './admin.controller';
import { UpdateTenantPlanUseCase } from './application/use-cases/update-tenant-plan.use-case';

@Module({
  imports: [TenantModule, AuthModule, PlansModule, EventsModule],
  controllers: [AdminController],
  providers: [UpdateTenantPlanUseCase],
})
export class AdminModule {}
