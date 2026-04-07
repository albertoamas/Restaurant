import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { TenantRepositoryPort } from '../../domain/ports/tenant-repository.port';
import { TenantSettings } from '../../domain/entities/tenant.entity';
import { OrderNumberResetPeriod, UserRole } from '@pos/shared';
import { Inject } from '@nestjs/common';

class UpdateTenantSettingsDto implements Partial<TenantSettings> {
  @IsOptional()
  @IsEnum(OrderNumberResetPeriod)
  orderNumberResetPeriod?: OrderNumberResetPeriod;
}

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
  ) {}

  @Patch('settings')
  @Roles(UserRole.OWNER)
  updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.tenantRepository.updateSettings(tenantId, dto);
  }
}
