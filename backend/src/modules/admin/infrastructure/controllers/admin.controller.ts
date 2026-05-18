import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlanDto, SaasPlan } from '@pos/shared';
import { AdminGuard } from '../../../../common/guards/admin.guard';
import { RegisterUseCase } from '../../../auth/application/use-cases/register.use-case';
import { RegisterDto } from '../../../auth/application/dto/register.dto';
import { ListTenantsUseCase } from '../../application/use-cases/list-tenants.use-case';
import { ToggleTenantActiveUseCase } from '../../application/use-cases/toggle-tenant-active.use-case';
import { UpdateTenantPlanUseCase } from '../../application/use-cases/update-tenant-plan.use-case';
import { UpdateTenantModulesUseCase } from '../../application/use-cases/update-tenant-modules.use-case';
import { ListPlansUseCase } from '../../application/use-cases/list-plans.use-case';
import { UpdatePlanLimitsUseCase } from '../../application/use-cases/update-plan-limits.use-case';
import { UpdatePlanDto } from '../../application/dto/update-plan.dto';
import { UpdateModulesDto } from '../../application/dto/update-modules.dto';
import { UpdatePlanLimitsDto } from '../../application/dto/update-plan-limits.dto';

@Controller('admin')
@UseGuards(AdminGuard)
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly listTenantsUseCase: ListTenantsUseCase,
    private readonly toggleTenantActiveUseCase: ToggleTenantActiveUseCase,
    private readonly updateTenantPlanUseCase: UpdateTenantPlanUseCase,
    private readonly updateTenantModulesUseCase: UpdateTenantModulesUseCase,
    private readonly listPlansUseCase: ListPlansUseCase,
    private readonly updatePlanLimitsUseCase: UpdatePlanLimitsUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Get('ping')
  ping() {
    return { ok: true };
  }

  // ── Tenants ────────────────────────────────────────────────

  @Get('tenants')
  listTenants() {
    return this.listTenantsUseCase.execute();
  }

  @Post('tenants')
  createTenant(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto, true);
  }

  @Patch('tenants/:id/toggle')
  async toggleTenant(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.toggleTenantActiveUseCase.execute(id);
    this.logger.log(`toggleTenant tenantId=${id} isActive=${result.isActive}`);
    return result;
  }

  @Patch('tenants/:id/plan')
  async updateTenantPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const result = await this.updateTenantPlanUseCase.execute(id, dto.plan);
    this.logger.log(`updateTenantPlan tenantId=${id} plan=${dto.plan}`);
    return result;
  }

  @Patch('tenants/:id/modules')
  async updateModules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModulesDto,
  ) {
    const result = await this.updateTenantModulesUseCase.execute(id, dto);
    this.logger.log(`updateModules tenantId=${id} ${JSON.stringify(dto)}`);
    return result;
  }

  // ── Plans ──────────────────────────────────────────────────

  @Get('plans')
  listPlans(): Promise<PlanDto[]> {
    return this.listPlansUseCase.execute();
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanLimitsDto,
  ) {
    return this.updatePlanLimitsUseCase.execute(id as SaasPlan, dto);
  }
}
