import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { BranchUsagePort, BRANCH_USAGE_PORT } from '../../domain/ports/branch-usage.port';
import { Branch } from '../../domain/entities/branch.entity';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

@Injectable()
export class ToggleBranchUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
    @Inject(BRANCH_USAGE_PORT)
    private readonly usage: BranchUsagePort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async execute(id: string, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepository.findById(id, tenantId);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    if (branch.isActive) {
      // Desactivar deja datos y usuarios apuntando a una sucursal que ya no
      // aparece en el selector.
      await this.assertCanDeactivate(tenantId, id);
    } else {
      // Reactivar suma una sucursal activa, y el cupo del plan cuenta solo las
      // activas: sin este control, desactivar → crear otra → reactivar dejaría
      // al negocio por encima de su límite.
      await this.assertWithinPlanLimit(tenantId);
    }

    branch.isActive = !branch.isActive;
    return this.branchRepository.save(branch);
  }

  private async assertWithinPlanLimit(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) return;
    const plan  = await this.planLimitService.getPlan(tenant.plan);
    const count = await this.branchRepository.countByTenant(tenantId);
    this.planLimitService.assertWithinLimit('sucursales', plan, count);
  }

  private async assertCanDeactivate(tenantId: string, branchId: string): Promise<void> {
    // Una caja abierta en una sucursal desactivada no se puede cerrar desde la
    // UI (el selector ya no la muestra) y el índice único impide abrir otra.
    if (await this.usage.hasOpenCashSession(tenantId, branchId)) {
      throw new BadRequestException(
        'No se puede desactivar una sucursal con la caja abierta. Cierra la caja primero.',
      );
    }

    // Su JWT sigue llevando este branchId: seguirían facturando contra una
    // sucursal que el dueño ya no ve.
    const cashiers = await this.usage.countActiveCashiers(tenantId, branchId);
    if (cashiers > 0) {
      throw new BadRequestException(
        cashiers === 1
          ? 'Hay 1 cajero asignado a esta sucursal. Reasignalo antes de desactivarla.'
          : `Hay ${cashiers} cajeros asignados a esta sucursal. Reasignalos antes de desactivarla.`,
      );
    }
  }
}
