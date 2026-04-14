import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { TenantRepositoryPort } from '../../domain/ports/tenant-repository.port';
import { TenantSettings } from '../../domain/entities/tenant.entity';
import { OrderNumberResetPeriod, UserRole } from '@pos/shared';
import { Inject } from '@nestjs/common';

// Acepta: null (limpiar logo), rutas relativas /uploads/<uuid>.webp, o URLs https absolutas
const LOGO_URL_REGEX = /^(\/uploads\/[\w.-]{1,200}|https?:\/\/.{1,400})$/;

class UpdateTenantSettingsDto implements Partial<TenantSettings> {
  @IsOptional()
  @IsEnum(OrderNumberResetPeriod)
  orderNumberResetPeriod?: OrderNumberResetPeriod;

  @IsOptional()
  @ValidateIf((o) => o.logoUrl !== null)
  @IsString()
  @MaxLength(500)
  @Matches(LOGO_URL_REGEX, { message: 'logoUrl debe ser una ruta /uploads/... o una URL https válida' })
  logoUrl?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.businessAddress !== null)
  @IsString()
  @MaxLength(255)
  businessAddress?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.businessPhone !== null)
  @IsString()
  @MaxLength(50)
  businessPhone?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.receiptSlogan !== null)
  @IsString()
  @MaxLength(255)
  receiptSlogan?: string | null;
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
