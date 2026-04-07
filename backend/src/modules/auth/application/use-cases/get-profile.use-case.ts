import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  async execute(userId: string, tenantId: string) {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new NotFoundException('User not found');

    const tenant = await this.tenantRepository.findById(user.tenantId);

    return {
      id:         user.id,
      tenantId:   user.tenantId,
      tenantName: tenant?.name ?? '',
      branchId:   user.branchId,
      email:      user.email,
      name:       user.name,
      role:       user.role,
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
