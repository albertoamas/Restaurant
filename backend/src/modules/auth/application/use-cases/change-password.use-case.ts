import * as bcrypt from 'bcrypt';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string, tenantId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new NotFoundException('User not found');

    const currentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentValid) throw new BadRequestException('La contraseña actual es incorrecta');

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.updatePassword(userId, tenantId, newHash);
  }
}
