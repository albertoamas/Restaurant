import { Module } from '@nestjs/common';
import { PlanRepository } from './infrastructure/persistence/plan.repository';
import { PlanLimitService } from './application/plan-limit.service';

@Module({
  providers: [
    { provide: 'PlanRepositoryPort', useClass: PlanRepository },
    PlanLimitService,
  ],
  exports: ['PlanRepositoryPort', PlanLimitService],
})
export class PlansModule {}
