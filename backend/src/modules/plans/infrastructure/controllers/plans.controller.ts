import { Controller, Get, Inject } from '@nestjs/common';
import { PlanDto } from '@pos/shared';
import { PlanRepositoryPort } from '../../domain/ports/plan-repository.port';

@Controller('plans')
export class PlansController {
  constructor(
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
  ) {}

  @Get()
  async findAll(): Promise<PlanDto[]> {
    const plans = await this.planRepo.findAll();
    return plans.map((p) => p.toDto());
  }
}
