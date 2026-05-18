import { Inject, Injectable } from '@nestjs/common';
import { PlanDto } from '@pos/shared';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';

@Injectable()
export class ListPlansUseCase {
  constructor(
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  async execute(): Promise<PlanDto[]> {
    const plans = await this.planRepo.findAll();
    return plans.map((p) => p.toDto());
  }
}
