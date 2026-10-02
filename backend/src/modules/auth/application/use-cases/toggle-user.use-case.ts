import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { ActiveSessionService } from '../services/active-session.service';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class ToggleUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    private readonly activeSession: ActiveSessionService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(userId: string, tenantId: string, requesterId: string) {
    const user = await this.userRepository.findById(userId, tenantId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.id === requesterId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    user.isActive = !user.isActive;
    const saved = await this.userRepository.save(user);

    // Sin esperar los 60 s de caché: desactivado, pierde la API y el tiempo real ya.
    this.activeSession.forgetUser(saved.id);
    if (!saved.isActive) this.eventsService.disconnectUser(saved.id);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      isActive: saved.isActive,
    };
  }
}
