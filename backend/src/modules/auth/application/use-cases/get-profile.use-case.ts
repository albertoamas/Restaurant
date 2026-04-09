import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

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
      tenantName: tenant?.name ?? '',
      tenantLogo: tenant?.logoUrl ?? null,
      branchId:   user.branchId,
      email:      user.email,
      name:       user.name,
      role:       user.role,
      plan:       planId,
      planLimits: plan.limits,
      modules: {
        ordersEnabled:          tenant?.ordersEnabled          ?? true,
        cashEnabled:            tenant?.cashEnabled            ?? true,
        teamEnabled:            tenant?.teamEnabled            ?? true,
        branchesEnabled:        tenant?.branchesEnabled        ?? true,
        kitchenEnabled:         tenant?.kitchenEnabled         ?? false,
        orderNumberResetPeriod: tenant?.orderNumberResetPeriod ?? 'DAILY',
      },
    };
  }
}
