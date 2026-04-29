import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlanDto, SaasPlan, TENANT_MODULES_UPDATED_EVENT } from '@pos/shared';
import { AdminGuard } from '../../common/guards/admin.guard';
import { TenantRepositoryPort } from '../tenant/domain/ports/tenant-repository.port';
import { RegisterUseCase } from '../auth/application/use-cases/register.use-case';
import { RegisterDto } from '../auth/application/dto/register.dto';
import { PlanRepositoryPort } from '../plans/domain/ports/plan-repository.port';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanLimitsDto } from './dto/update-plan-limits.dto';
import { UpdateTenantPlanUseCase } from './application/use-cases/update-tenant-plan.use-case';
import { EventsService } from '../events/events.service';

@Controller('admin')
@UseGuards(AdminGuard)
@Throttle({ default: { ttl: 60000, limit: 10 } })
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepository: PlanRepositoryPort,
    private readonly registerUseCase: RegisterUseCase,
    private readonly updateTenantPlanUseCase: UpdateTenantPlanUseCase,
    private readonly eventsService: EventsService,
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
  async toggleTenant(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.tenantRepository.toggleActive(id);
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
    this.eventsService.emitToTenant(id, TENANT_MODULES_UPDATED_EVENT, {});
    return result;
  }

  @Patch('tenants/:id/modules')
  async updateModules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModulesDto,
  ) {
    const result = await this.tenantRepository.updateModules(id, dto);
    this.logger.log(`updateModules tenantId=${id} ${JSON.stringify(dto)}`);
    this.eventsService.emitToTenant(id, TENANT_MODULES_UPDATED_EVENT, {});
    return result;
  }

  // ── Plans ──────────────────────────────────────────────────

  @Get('plans')
  async listPlans(): Promise<PlanDto[]> {
    const plans = await this.planRepository.findAll();
    return plans.map((p) => p.toDto());
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanLimitsDto,
  ) {
    return this.planRepository.update(id as SaasPlan, dto);
  }
}
