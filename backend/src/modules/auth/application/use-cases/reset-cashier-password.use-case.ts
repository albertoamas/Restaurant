import * as bcrypt from 'bcryptjs';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { ResetCashierPasswordDto } from '../dto/reset-cashier-password.dto';

@Injectable()
export class ResetCashierPasswordUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string, tenantId: string, dto: ResetCashierPasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== UserRole.CASHIER) {
      throw new ForbiddenException('Solo se puede resetear la contraseña de cajeros');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.updatePassword(userId, tenantId, newHash);
  }
}
