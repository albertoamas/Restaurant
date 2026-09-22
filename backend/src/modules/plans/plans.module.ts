import { Module } from '@nestjs/common';
import { PlanRepository } from './infrastructure/persistence/plan.repository';
import { PlansController } from './infrastructure/controllers/plans.controller';
import { PlanLimitService } from './application/plan-limit.service';
import { PlanModulesService } from './application/plan-modules.service';

@Module({
  controllers: [PlansController],
  providers: [
    { provide: 'PlanRepositoryPort', useClass: PlanRepository },
    PlanLimitService,
    PlanModulesService,
  ],
  exports: ['PlanRepositoryPort', PlanLimitService, PlanModulesService],
})
export class PlansModule {}
