import { mock, MockProxy } from 'jest-mock-extended';
import { CashSessionStatus } from '@pos/shared';
import { GetCurrentSessionUseCase } from './get-current-session.use-case';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { CashSession } from '../../domain/entities/cash-session.entity';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';
const BRANCH_ID = 'branch-1';

function makeSession(openedAt = new Date()): CashSession {
  return CashSession.reconstitute({
    id:              'session-1',
    tenantId:        TENANT_ID,
    branchId:        BRANCH_ID,
    openedBy:        'user-1',
    closedBy:        null,
    openingAmount:   200,
    closingAmount:   null,
    expectedAmount:  null,
    difference:      null,
    status:          CashSessionStatus.OPEN,
    openedAt,
    closedAt:        null,
    notes:           null,
  });
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('GetCurrentSessionUseCase', () => {
  let useCase: GetCurrentSessionUseCase;
  let repo: MockProxy<CashSessionRepositoryPort>;

  beforeEach(() => {
    repo    = mock<CashSessionRepositoryPort>();
    useCase = new GetCurrentSessionUseCase(repo);
  });

  it('retorna null cuando no hay sesión abierta para la sucursal', async () => {
    repo.findOpenByBranch.mockResolvedValue(null);

    const result = await useCase.execute(TENANT_ID, BRANCH_ID);

    expect(result).toBeNull();
    expect(repo.getCashSalesDuringSession).not.toHaveBeenCalled();
  });

  it('retorna la sesión con cashSales cuando hay una sesión abierta', async () => {
    const session = makeSession();
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(350);

    const result = await useCase.execute(TENANT_ID, BRANCH_ID);

    expect(result).not.toBeNull();
    expect(result!.cashSales).toBe(350);
    expect(result!.id).toBe('session-1');
  });

  it('consulta getCashSalesDuringSession con la fecha de apertura correcta', async () => {
    const openedAt = new Date('2026-04-25T08:00:00Z');
    const session  = makeSession(openedAt);
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(0);

    await useCase.execute(TENANT_ID, BRANCH_ID);

    expect(repo.getCashSalesDuringSession).toHaveBeenCalledWith(
      TENANT_ID,
      BRANCH_ID,
      openedAt,
    );
  });

  it('cashSales = 0 cuando no hay ventas en efectivo durante la sesión', async () => {
    const session = makeSession();
    repo.findOpenByBranch.mockResolvedValue(session);
    repo.getCashSalesDuringSession.mockResolvedValue(0);

    const result = await useCase.execute(TENANT_ID, BRANCH_ID);

    expect(result!.cashSales).toBe(0);
  });
});
