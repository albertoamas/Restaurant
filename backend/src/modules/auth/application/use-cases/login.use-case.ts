import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto) {
    const user = await this.userRepository.findByEmailGlobal(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.tenantRepository.findById(user.tenantId);

    if (!tenant?.isActive) {
      throw new ForbiddenException('Tu cuenta está inactiva. Contacta al administrador para activarla.');
    }

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        tenantName: tenant.name,
        branchId: user.branchId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
