import { Body, Controller, Inject, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../../common/decorators/tenant.decorator';
import { UpdateTenantSettingsUseCase } from '../../application/use-cases/update-tenant-settings.use-case';
import { UpdateTenantSettingsDto } from '../../application/dto/update-tenant-settings.dto';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(
    @Inject(UpdateTenantSettingsUseCase)
    private readonly updateTenantSettingsUseCase: UpdateTenantSettingsUseCase,
  ) {}

  @Patch('settings')
  @Roles(UserRole.OWNER)
  updateSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    return this.updateTenantSettingsUseCase.execute(tenantId, dto);
  }
}
