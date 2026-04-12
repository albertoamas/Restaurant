import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { CashSessionStatus } from '@pos/shared';
import { CloseCashSessionUseCase } from './close-cash-session.use-case';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { CashSession } from '../../domain/entities/cash-session.entity';

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

  beforeEach(() => {
    repo          = mock<CashSessionRepositoryPort>();
    eventsService = mock<EventsService>();
    useCase       = new CloseCashSessionUseCase(repo, eventsService);
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
