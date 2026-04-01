import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { CreateCashierDto } from '../dto/create-cashier.dto';

@Injectable()
export class CreateCashierUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreateCashierDto) {
    const existing = await this.userRepository.findByEmail(tenantId, dto.email);
    if (existing) throw new ConflictException('Email ya está en uso en este negocio');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = User.create({
      tenantId,
      branchId: dto.branchId ?? null,
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: UserRole.CASHIER,
    });

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      branchId: saved.branchId,
      isActive: saved.isActive,
    };
  }
}
