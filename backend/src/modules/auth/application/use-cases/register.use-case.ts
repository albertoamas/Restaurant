import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
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
  ) {}

  async execute(dto: RegisterDto, startActive = false) {
    const existingUser = await this.userRepository.findByEmailGlobal(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const baseTenant = Tenant.create(dto.businessName, slugify(dto.businessName));
    const tenant = startActive ? baseTenant.withActive(true) : baseTenant;
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

    return { tenantId: tenant.id, message: 'Negocio creado correctamente.' };
  }
}
