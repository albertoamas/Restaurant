import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { SaasPlan } from '@pos/shared';
import { PlanRepositoryPort } from '../domain/ports/plan-repository.port';
import { Plan } from '../domain/entities/plan.entity';

type LimitedResource = 'sucursales' | 'cajeros' | 'productos';

/** El singular no siempre es quitar la última letra ('sucursales' → 'sucursale'). */
const SINGULAR: Record<LimitedResource, string> = {
  sucursales: 'sucursal',
  cajeros:    'cajero',
  productos:  'producto',
};

@Injectable()
export class PlanLimitService {
  constructor(
    @Inject('PlanRepositoryPort')
    private readonly planRepository: PlanRepositoryPort,
  ) {}

  async getPlan(planId: string): Promise<Plan> {
    const plan = await this.planRepository.findById(planId as SaasPlan);
    if (!plan) throw new ForbiddenException(`Plan ${planId} no encontrado`);
    return plan;
  }

  assertWithinLimit(resource: LimitedResource, plan: Plan, current: number): void {
    const max =
      resource === 'sucursales' ? plan.maxBranches :
      resource === 'cajeros'    ? plan.maxCashiers  :
                                  plan.maxProducts;

    if (max !== -1 && current >= max) {
      const label = max === 1 ? `1 ${SINGULAR[resource]}` : `${max} ${resource}`;
      throw new ForbiddenException(
        `Tu plan ${plan.displayName} permite hasta ${label}. ` +
        `Contacta al administrador para actualizar tu plan.`,
      );
    }
  }
}
