import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';
import { ActiveSessionService } from '../services/active-session.service';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateUserBranchUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    private readonly branchAccess: BranchAccessService,
    private readonly activeSession: ActiveSessionService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(targetUserId: string, tenantId: string, branchId: string | null): Promise<void> {
    const user = await this.userRepository.findById(targetUserId, tenantId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('No se puede asignar sucursal al dueño');
    }

    if (branchId) {
      await this.branchAccess.assertUsable(branchId, tenantId);
    }

    await this.userRepository.updateBranch(targetUserId, tenantId, branchId);

    // La nueva sucursal rige ya para la API y para el tiempo real, sin re-login.
    this.activeSession.forgetUser(targetUserId);
    await this.eventsService.moveUserToBranch(tenantId, targetUserId, branchId);
  }
}
