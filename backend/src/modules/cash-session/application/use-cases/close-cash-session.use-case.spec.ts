import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CashSessionStatus } from '@pos/shared';
import { CloseCashSessionUseCase } from './close-cash-session.use-case';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';

function makeOpenSession(openingAmount = 500): CashSession {
  return CashSession.open({
    tenantId:      'tenant-1',
    branchId:      'branch-1',
    openedBy:      'user-1',
    openingAmount,
  });
}

describe('CloseCashSessionUseCase', () => {
  let useCase: CloseCashSessionUseCase;
  let repo: MockProxy<CashSessionRepositoryPort>;
  let eventsService: MockProxy<EventsService>;
  let branchAccess: MockProxy<BranchAccessService>;

  beforeEach(() => {
    repo          = mock<CashSessionRepositoryPort>();
    eventsService = mock<EventsService>();
    branchAccess  = mock<BranchAccessService>();
    useCase       = new CloseCashSessionUseCase(repo, branchAccess, eventsService);
    repo.save.mockImplementation(async (s) => s);
  });

  it('calcula difference = closingAmount - (openingAmount + cashSales)', async () => {
    const session = makeOpenSession(500);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(200); // 200 en ventas

    const result = await useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 750 });

    // expected = 500 + 200 = 700; difference = 750 - 700 = 50
    expect(result.expectedAmount).toBe(700);
    expect(result.difference).toBe(50);
    expect(result.closingAmount).toBe(750);
  });

  it('con cashSales = 0 la diferencia es closingAmount - openingAmount', async () => {
    const session = makeOpenSession(300);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(0);

    const result = await useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 310 });

    expect(result.difference).toBe(10); // 310 - 300
  });

  it('lanza NotFoundException si no hay sesión abierta para la sucursal', async () => {
    repo.findOpenByBranch.mockResolvedValue(null);
    await expect(useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 500 }))
      .rejects.toThrow(NotFoundException);
  });

  it('valida que la sucursal pertenezca al tenant antes de buscar la sesión', async () => {
    const session = makeOpenSession(500);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(0);

    await useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 500 });

    expect(branchAccess.assertBelongsToTenant).toHaveBeenCalledWith('branch-1', 'tenant-1');
  });

  it('no busca la sesión si la sucursal no existe o es de otro tenant', async () => {
    branchAccess.assertBelongsToTenant.mockRejectedValue(new BadRequestException('Sucursal no encontrada'));

    await expect(useCase.execute('tenant-1', 'branch-ajena', 'user-1', { closingAmount: 500 }))
      .rejects.toThrow(BadRequestException);

    expect(repo.findOpenByBranch).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('usa assertBelongsToTenant, no assertUsable: cerrar no debe exigir sucursal activa', async () => {
    // ToggleBranchUseCase exige la caja cerrada ANTES de desactivar una sucursal,
    // así que cerrar caja debe seguir siendo posible en ese tramo sin bloquearse
    // a sí mismo con un chequeo de "activa".
    const session = makeOpenSession(500);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(0);

    await useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 500 });

    expect(branchAccess.assertBelongsToTenant).toHaveBeenCalled();
    expect(branchAccess.assertUsable).not.toHaveBeenCalled();
  });

  it('la sesión queda en estado CLOSED después del cierre', async () => {
    const session = makeOpenSession(200);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(100);

    const result = await useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 300 });

    expect(result.status).toBe(CashSessionStatus.CLOSED);
    expect(result.closedAt).toBeTruthy();
  });

  it('emite el evento cash.closed al cerrar', async () => {
    const session = makeOpenSession(100);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(0);

    const result = await useCase.execute('tenant-1', 'branch-1', 'user-1', { closingAmount: 100 });

    expect(eventsService.emitToTenant).toHaveBeenCalledWith('tenant-1', 'cash.closed', result);
  });
});
