import * as bcrypt from 'bcryptjs';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { ResetUserPasswordDto } from '../dto/reset-user-password.dto';

@Injectable()
export class ResetUserPasswordAdminUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string, dto: ResetUserPasswordDto): Promise<void> {
    const user = await this.userRepository.findByIdGlobal(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.updatePasswordAdmin(userId, newHash);
  }
}
