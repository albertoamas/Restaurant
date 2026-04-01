import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class UpdateUserBranchUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(targetUserId: string, tenantId: string, branchId: string | null): Promise<void> {
    const user = await this.userRepository.findById(targetUserId, tenantId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('No se puede asignar sucursal al dueño');
    }

    await this.userRepository.updateBranch(targetUserId, tenantId, branchId);
  }
}
