import * as bcrypt from 'bcryptjs';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class VerifyPasswordUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(userId: string, tenantId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');
  }
}
