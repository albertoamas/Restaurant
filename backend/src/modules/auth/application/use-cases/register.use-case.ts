import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto) {
    const existingUser = await this.userRepository.findByEmailGlobal(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const tenant = Tenant.create(dto.businessName, slugify(dto.businessName));

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = User.create({
      tenantId: tenant.id,
      email: dto.email,
      passwordHash,
      name: dto.ownerName,
      role: UserRole.OWNER,
    });

    await this.tenantRepository.save(tenant);
    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        tenantName: tenant.name,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
