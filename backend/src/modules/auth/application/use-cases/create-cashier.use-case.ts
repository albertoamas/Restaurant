import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@pos/shared';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { CreateCashierDto } from '../dto/create-cashier.dto';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';

@Injectable()
export class CreateCashierUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly planLimitService: PlanLimitService,
    private readonly branchAccess: BranchAccessService,
  ) {}

  async execute(tenantId: string, dto: CreateCashierDto) {
    // Un branchId inválido dejaría al cajero facturando contra una sucursal
    // inexistente: sus ventas no aparecerían en ningún reporte.
    if (dto.branchId) {
      await this.branchAccess.assertUsable(dto.branchId, tenantId);
    }

    const tenant = await this.tenantRepository.findById(tenantId);
    if (tenant) {
      const plan = await this.planLimitService.getPlan(tenant.plan);
      const count = await this.userRepository.countCashiersByTenant(tenantId);
      this.planLimitService.assertWithinLimit('cajeros', plan, count);
    }

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
