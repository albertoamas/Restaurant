import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan, SOCKET_EVENTS, isUnlimited } from '@pos/shared';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { EventsService } from '../../../events/events.service';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { UpdatePlanLimitsDto } from '../dto/update-plan-limits.dto';

/** Campos numéricos donde 0 no tiene sentido comercial. */
const POSITIVE_LIMITS = [
  { key: 'maxBranches'       as const, label: 'sucursales' },
  { key: 'maxCashiers'       as const, label: 'cajeros' },
  { key: 'maxProducts'       as const, label: 'productos' },
  // Con 0 el tenant no puede subir ni una imagen ni ver el reporte de hoy:
  // el plan queda vendido pero inservible.
  { key: 'reportHistoryDays' as const, label: 'días de historial' },
  { key: 'maxStorageMb'      as const, label: 'MB de imágenes' },
];

/** Los planes van de menor a mayor: un plan más caro no puede dar menos. */
const PLAN_ORDER: SaasPlan[] = [SaasPlan.BASICO, SaasPlan.PRO, SaasPlan.NEGOCIO];

@Injectable()
export class UpdatePlanLimitsUseCase {
  constructor(
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    private readonly planModules: PlanModulesService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(planId: SaasPlan, dto: UpdatePlanLimitsDto): Promise<Plan> {
    const current = await this.planRepo.findById(planId);
    if (!current) throw new NotFoundException(`Plan ${planId} no encontrado`);

    // Los planes son globales: un valor mal puesto acá afecta de golpe a todos
    // los clientes de ese plan, así que se valida antes de escribir.
    this.assertPositiveLimits(dto);
    await this.assertConsistentWithOtherPlans(planId, current.withUpdates(dto));

    const updated = await this.planRepo.update(planId, dto);
    await this.resyncTenants(updated);
    return updated;
  }

  /**
   * Los módulos efectivos de cada tenant se derivan del plan, así que editar el
   * plan debe recalcularlos ya. Sin esto el cambio parecía no hacer nada hasta
   * que algo no relacionado volvía a tocar ese tenant.
   */
  private async resyncTenants(plan: Plan): Promise<void> {
    const tenants = await this.tenantRepo.findByPlan(plan.id);

    for (const tenant of tenants) {
      const overrides = this.planModules.pruneOverrides(plan, tenant.moduleOverrides);
      const modules   = this.planModules.resolveModules(plan, overrides);
      await this.tenantRepo.applyModules(tenant.id, modules, overrides);
      this.eventsService.emitToTenant(tenant.id, SOCKET_EVENTS.TENANT_MODULES_UPDATED, {});
    }
  }

  private assertPositiveLimits(dto: UpdatePlanLimitsDto): void {
    for (const { key, label } of POSITIVE_LIMITS) {
      if (dto[key] === 0) {
        throw new BadRequestException(
          `El límite de ${label} no puede ser 0. Usa -1 para "sin límite".`,
        );
      }
    }
  }

  /** Un plan más caro nunca debe quedar por debajo de uno más barato. */
  private async assertConsistentWithOtherPlans(planId: SaasPlan, updated: Plan): Promise<void> {
    const index = PLAN_ORDER.indexOf(planId);
    if (index === -1) return;

    const all = await this.planRepo.findAll();
    const byId = new Map(all.map((p) => [p.id, p]));

    const cheaper = index > 0 ? byId.get(PLAN_ORDER[index - 1]) : undefined;
    const pricier = index < PLAN_ORDER.length - 1 ? byId.get(PLAN_ORDER[index + 1]) : undefined;

    if (cheaper) this.assertNotBelow(updated, cheaper);
    if (pricier) this.assertNotBelow(pricier, updated);
  }

  private assertNotBelow(higher: Plan, lower: Plan): void {
    for (const { key, label } of POSITIVE_LIMITS) {
      const h = higher[key];
      const l = lower[key];
      // "Sin límite" siempre es mayor o igual que cualquier número.
      if (isUnlimited(h)) continue;
      if (isUnlimited(l) || h < l) {
        throw new BadRequestException(
          `El plan ${higher.displayName} quedaría con menos ${label} que ${lower.displayName}. ` +
          `Revisá los límites: un plan más caro no puede ofrecer menos.`,
        );
      }
    }
  }
}
