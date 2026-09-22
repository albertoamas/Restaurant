import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { ToggleBranchUseCase } from './toggle-branch.use-case';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { BranchUsagePort } from '../../domain/ports/branch-usage.port';
import { Branch } from '../../domain/entities/branch.entity';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

const TENANT_ID = 'tenant-1';
const BRANCH_ID = 'branch-1';

function makeBranch(isActive: boolean): Branch {
  return Branch.reconstitute({
    id: BRANCH_ID, tenantId: TENANT_ID, name: 'Sucursal Norte',
    address: null, phone: null, isActive, createdAt: new Date(),
  });
}

describe('ToggleBranchUseCase', () => {
  let useCase: ToggleBranchUseCase;
  let repo: MockProxy<BranchRepositoryPort>;
  let usage: MockProxy<BranchUsagePort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planLimitService: MockProxy<PlanLimitService>;

  beforeEach(() => {
    repo             = mock<BranchRepositoryPort>();
    usage            = mock<BranchUsagePort>();
    tenantRepo       = mock<TenantRepositoryPort>();
    planLimitService = mock<PlanLimitService>();
    useCase = new ToggleBranchUseCase(repo, usage, tenantRepo, planLimitService);

    repo.save.mockImplementation(async (b) => b);
    usage.hasOpenCashSession.mockResolvedValue(false);
    usage.countActiveCashiers.mockResolvedValue(0);
    tenantRepo.findById.mockResolvedValue({ plan: 'BASICO' } as never);
    planLimitService.getPlan.mockResolvedValue({ displayName: 'Básico', maxBranches: 1 } as never);
    planLimitService.assertWithinLimit.mockReturnValue(undefined);
  });

  it('lanza NotFoundException si la sucursal no existe en el tenant', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(BRANCH_ID, TENANT_ID)).rejects.toThrow(NotFoundException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('desactiva una sucursal sin caja abierta ni cajeros asignados', async () => {
    repo.findById.mockResolvedValue(makeBranch(true));
    const result = await useCase.execute(BRANCH_ID, TENANT_ID);
    expect(result.isActive).toBe(false);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza desactivar si hay una caja abierta', async () => {
    repo.findById.mockResolvedValue(makeBranch(true));
    usage.hasOpenCashSession.mockResolvedValue(true);
    await expect(useCase.execute(BRANCH_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('rechaza desactivar si hay cajeros activos asignados', async () => {
    repo.findById.mockResolvedValue(makeBranch(true));
    usage.countActiveCashiers.mockResolvedValue(2);
    await expect(useCase.execute(BRANCH_ID, TENANT_ID)).rejects.toThrow(/2 cajeros asignados/);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('reactivar nunca comprueba caja ni cajeros', async () => {
    repo.findById.mockResolvedValue(makeBranch(false));
    const result = await useCase.execute(BRANCH_ID, TENANT_ID);
    expect(result.isActive).toBe(true);
    expect(usage.hasOpenCashSession).not.toHaveBeenCalled();
    expect(usage.countActiveCashiers).not.toHaveBeenCalled();
  });

  it('reactivar verifica el límite de sucursales del plan', async () => {
    repo.findById.mockResolvedValue(makeBranch(false));
    repo.countByTenant.mockResolvedValue(1);

    await useCase.execute(BRANCH_ID, TENANT_ID);

    expect(planLimitService.assertWithinLimit).toHaveBeenCalledWith('sucursales', expect.anything(), 1);
  });

  it('no reactiva si el plan ya llegó a su límite de sucursales', async () => {
    repo.findById.mockResolvedValue(makeBranch(false));
    repo.countByTenant.mockResolvedValue(1);
    planLimitService.assertWithinLimit.mockImplementation(() => {
      throw new ForbiddenException('Límite alcanzado');
    });

    await expect(useCase.execute(BRANCH_ID, TENANT_ID)).rejects.toThrow(ForbiddenException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
