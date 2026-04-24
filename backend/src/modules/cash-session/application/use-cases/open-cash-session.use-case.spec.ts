import { ConflictException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OpenCashSessionUseCase } from './open-cash-session.use-case';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { EventsService } from '../../../events/events.service';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionStatus } from '@pos/shared';

function makeOpenSession(): CashSession {
  return CashSession.open({ tenantId: 'tenant-1', branchId: 'branch-1', openedBy: 'user-1', openingAmount: 500 });
}

const DTO = { openingAmount: 500 };

describe('OpenCashSessionUseCase', () => {
  let useCase: OpenCashSessionUseCase;
  let repo: MockProxy<CashSessionRepositoryPort>;
  let eventsService: MockProxy<EventsService>;

  beforeEach(() => {
    repo          = mock<CashSessionRepositoryPort>();
    eventsService = mock<EventsService>();
    useCase       = new OpenCashSessionUseCase(repo, eventsService);
    repo.save.mockImplementation(async (s) => s);
  });

  it('crea y devuelve una sesión abierta cuando no hay ninguna activa', async () => {
    repo.findOpenByBranch.mockResolvedValue(null);

    const result = await useCase.execute('tenant-1', 'branch-1', 'user-1', DTO);

    expect(result.status).toBe(CashSessionStatus.OPEN);
    expect(result.openingAmount).toBe(500);
    expect(result.tenantId).toBe('tenant-1');
    expect(result.branchId).toBe('branch-1');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('emite el evento cash.opened al abrir correctamente', async () => {
    repo.findOpenByBranch.mockResolvedValue(null);

    const result = await useCase.execute('tenant-1', 'branch-1', 'user-1', DTO);

    expect(eventsService.emitToTenant).toHaveBeenCalledWith('tenant-1', 'cash.opened', result);
  });

  it('lanza ConflictException (check en app) si ya existe una sesión abierta', async () => {
    repo.findOpenByBranch.mockResolvedValue(makeOpenSession());

    await expect(useCase.execute('tenant-1', 'branch-1', 'user-1', DTO))
      .rejects.toThrow(ConflictException);

    // No llega al save — rechazo temprano
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lanza ConflictException (check en DB) si repo.save() lanza P2002 — segunda línea de defensa', async () => {
    // Simula el caso de race condition: ambos requests pasan el findOpenByBranch
    // pero solo el primero completa el INSERT; el segundo recibe la violación del índice.
    repo.findOpenByBranch.mockResolvedValue(null);
    const dbError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    repo.save.mockRejectedValue(dbError);

    await expect(useCase.execute('tenant-1', 'branch-1', 'user-1', DTO))
      .rejects.toThrow(ConflictException);
  });

  it('re-lanza errores de DB que no sean P2002 sin modificarlos', async () => {
    repo.findOpenByBranch.mockResolvedValue(null);
    const unexpectedError = Object.assign(new Error('Connection lost'), { code: 'P1001' });
    repo.save.mockRejectedValue(unexpectedError);

    await expect(useCase.execute('tenant-1', 'branch-1', 'user-1', DTO))
      .rejects.toThrow('Connection lost');
  });

  it('no emite evento si repo.save() lanza error', async () => {
    repo.findOpenByBranch.mockResolvedValue(null);
    repo.save.mockRejectedValue(Object.assign(new Error('DB error'), { code: 'P2002' }));

    await expect(useCase.execute('tenant-1', 'branch-1', 'user-1', DTO)).rejects.toThrow();

    expect(eventsService.emitToTenant).not.toHaveBeenCalled();
  });
});
