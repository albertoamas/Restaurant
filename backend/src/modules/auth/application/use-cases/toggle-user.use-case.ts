import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class ToggleUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
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

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      isActive: saved.isActive,
    };
  }
}
