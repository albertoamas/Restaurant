import { Inject, Injectable } from '@nestjs/common';
import { SaasPlan } from '@pos/shared';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { UpdatePlanLimitsDto } from '../dto/update-plan-limits.dto';

@Injectable()
export class UpdatePlanLimitsUseCase {
  constructor(
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  execute(planId: SaasPlan, dto: UpdatePlanLimitsDto): Promise<Plan> {
    return this.planRepo.update(planId, dto);
  }
}
