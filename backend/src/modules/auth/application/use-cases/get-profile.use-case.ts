import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { TenantModules } from '../../../tenant/domain/entities/tenant.entity';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

/**
 * Solo se usa si el tenant del usuario desapareciera de la BD (no debería:
 * `user.tenant_id` es FK). Tipado para que un módulo nuevo obligue a decidir
 * su valor por defecto en vez de quedar `undefined`.
 */
const FALLBACK_MODULES: TenantModules = {
  ordersEnabled:   true,
  cashEnabled:     true,
  teamEnabled:     true,
  branchesEnabled: true,
  kitchenEnabled:  false,
  rafflesEnabled:  false,
  advancedReportsEnabled: false,
};

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async execute(userId: string, tenantId: string) {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new NotFoundException('User not found');

    const tenant = await this.tenantRepository.findById(user.tenantId);
    const planId = tenant?.plan ?? SaasPlan.BASICO;
    const plan = await this.planLimitService.getPlan(planId);

    return {
      id:         user.id,
      tenantId:   user.tenantId,
      tenantName:    tenant?.name            ?? '',
      tenantAddress: tenant?.businessAddress ?? null,
      tenantPhone:   tenant?.businessPhone   ?? null,
      tenantSlogan:  tenant?.receiptSlogan   ?? null,
      branchId:   user.branchId,
      email:      user.email,
      name:       user.name,
      role:       user.role,
      plan:       planId,
      planLimits: plan.limits,
      // `tenant.modules` está tipado con TenantModules: un flag nuevo viaja
      // solo, sin que haya que acordarse de agregarlo aquí y en el login.
      modules: {
        ...(tenant ? tenant.modules : FALLBACK_MODULES),
        orderNumberResetPeriod: tenant?.orderNumberResetPeriod ?? OrderNumberResetPeriod.DAILY,
      },
    };
  }
}
