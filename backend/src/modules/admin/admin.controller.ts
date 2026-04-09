import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { SaasPlan } from '@pos/shared';
import { AdminGuard } from '../../common/guards/admin.guard';
import { TenantRepositoryPort } from '../tenant/domain/ports/tenant-repository.port';
import { TenantModules } from '../tenant/domain/entities/tenant.entity';
import { RegisterUseCase } from '../auth/application/use-cases/register.use-case';
import { RegisterDto } from '../auth/application/dto/register.dto';
import { PlanRepositoryPort } from '../plans/domain/ports/plan-repository.port';

class UpdateModulesDto implements Partial<TenantModules> {
  @IsOptional() @IsBoolean() ordersEnabled?:   boolean;
  @IsOptional() @IsBoolean() cashEnabled?:     boolean;
  @IsOptional() @IsBoolean() teamEnabled?:     boolean;
  @IsOptional() @IsBoolean() branchesEnabled?: boolean;
  @IsOptional() @IsBoolean() kitchenEnabled?:  boolean;
}

class UpdatePlanDto {
  @IsEnum(SaasPlan)
  plan: SaasPlan;
}

class UpdatePlanLimitsDto {
  @IsOptional() @IsString()  displayName?:    string;
  @IsOptional() @IsNumber()  priceBs?:        number;
  @IsOptional() @IsNumber() @Min(-1) maxBranches?:    number;
  @IsOptional() @IsNumber() @Min(-1) maxCashiers?:    number;
  @IsOptional() @IsNumber() @Min(-1) maxProducts?:    number;
  @IsOptional() @IsBoolean() kitchenEnabled?: boolean;
}

@Controller('admin')
@UseGuards(AdminGuard)
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class AdminController {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepository: PlanRepositoryPort,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Get('ping')
  ping() {
    return { ok: true };
  }

  // ── Tenants ────────────────────────────────────────────────

  @Get('tenants')
  listTenants() {
    return this.tenantRepository.findAll();
  }

  @Post('tenants')
  createTenant(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto, true);
  }

  @Patch('tenants/:id/toggle')
  toggleTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantRepository.toggleActive(id);
  }

  @Patch('tenants/:id/plan')
  updateTenantPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.tenantRepository.updatePlan(id, dto.plan);
  }

  @Patch('tenants/:id/modules')
  updateModules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModulesDto,
  ) {
    return this.tenantRepository.updateModules(id, dto);
  }

  // ── Plans ──────────────────────────────────────────────────

  @Get('plans')
  listPlans() {
    return this.planRepository.findAll();
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanLimitsDto,
  ) {
    return this.planRepository.update(id as SaasPlan, dto);
  }
}
