import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../../common/guards/admin.guard';
import { TenantRepositoryPort } from '../tenant/domain/ports/tenant-repository.port';
import { RegisterUseCase } from '../auth/application/use-cases/register.use-case';
import { RegisterDto } from '../auth/application/dto/register.dto';

@Controller('admin')
@UseGuards(AdminGuard)
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class AdminController {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Get('ping')
  ping() {
    return { ok: true };
  }

  @Get('tenants')
  listTenants() {
    return this.tenantRepository.findAll();
  }

  @Post('tenants')
  createTenant(@Body() dto: RegisterDto) {
    // Admin-created tenants start active (payment already confirmed)
    return this.registerUseCase.execute(dto, true);
  }

  @Patch('tenants/:id/toggle')
  toggleTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantRepository.toggleActive(id);
  }
}
