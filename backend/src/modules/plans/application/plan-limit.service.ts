import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { SaasPlan, isUnlimited } from '@pos/shared';
import { PlanRepositoryPort } from '../domain/ports/plan-repository.port';
import { Plan } from '../domain/entities/plan.entity';

export type LimitedResource = 'sucursales' | 'cajeros' | 'productos';

/** Cuánto usa hoy un tenant de cada recurso limitado por el plan. */
export type PlanUsage = Record<LimitedResource, number>;

/** Un recurso que quedó por encima de lo que permite el plan. */
export interface PlanExcess {
  resource: LimitedResource;
  current: number;
  max: number;
}

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

  /** El tope del plan para ese recurso. -1 = sin límite. */
  maxFor(plan: Plan, resource: LimitedResource): number {
    return resource === 'sucursales' ? plan.maxBranches
         : resource === 'cajeros'    ? plan.maxCashiers
         :                             plan.maxProducts;
  }

  /**
   * ¿Lo que el tenant YA tiene cabe en el plan? Distinto de poder crear uno
   * más: justo en el tope, lo existente cabe pero no se puede agregar nada.
   * Por eso son dos preguntas y no una.
   */
  fitsInPlan(plan: Plan, resource: LimitedResource, current: number): boolean {
    const max = this.maxFor(plan, resource);
    return isUnlimited(max) || current <= max;
  }

  /**
   * Qué recursos quedaron por encima del plan, típicamente tras un downgrade.
   * No destruye nada: informa para que /admin lo muestre y el admin decida.
   */
  findExcess(plan: Plan, usage: PlanUsage): PlanExcess[] {
    return (Object.keys(usage) as LimitedResource[])
      .filter((resource) => !this.fitsInPlan(plan, resource, usage[resource]))
      .map((resource) => ({
        resource,
        current: usage[resource],
        max:     this.maxFor(plan, resource),
      }));
  }

  assertWithinLimit(resource: LimitedResource, plan: Plan, current: number): void {
    const max = this.maxFor(plan, resource);

    if (!isUnlimited(max) && current >= max) {
      const label = max === 1 ? `1 ${SINGULAR[resource]}` : `${max} ${resource}`;
      throw new ForbiddenException(
        `Tu plan ${plan.displayName} permite hasta ${label}. ` +
        `Contacta al administrador para actualizar tu plan.`,
      );
    }
  }
}
