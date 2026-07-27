import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { UpdateCashierDto } from '../dto/update-cashier.dto';

@Injectable()
export class UpdateCashierUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string, tenantId: string, dto: UpdateCashierDto) {
    if (!dto.name && !dto.email) {
      throw new BadRequestException('Debes proporcionar al menos un campo para actualizar');
    }

    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== UserRole.CASHIER) {
      throw new ForbiddenException('Solo se pueden editar cajeros');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(tenantId, dto.email);
      if (existing) throw new ConflictException('El email ya está en uso en este negocio');
    }

    const updated = await this.userRepository.updateProfile(userId, tenantId, {
      name: dto.name,
      email: dto.email,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      branchId: updated.branchId,
      isActive: updated.isActive,
    };
  }
}
