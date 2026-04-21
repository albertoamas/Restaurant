import { Module } from '@nestjs/common';
import { PlanRepository } from './infrastructure/persistence/plan.repository';
import { PlansController } from './infrastructure/controllers/plans.controller';
import { PlanLimitService } from './application/plan-limit.service';

@Module({
  controllers: [PlansController],
  providers: [
    { provide: 'PlanRepositoryPort', useClass: PlanRepository },
    PlanLimitService,
  ],
  exports: ['PlanRepositoryPort', PlanLimitService],
})
export class PlansModule {}
