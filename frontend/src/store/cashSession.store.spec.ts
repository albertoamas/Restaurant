import { describe, it, expect, beforeEach } from 'vitest';
import { CashSessionStatus } from '@pos/shared';
import { useCashSessionStore } from './cashSession.store';
import type { CashSessionDto } from '@pos/shared';

beforeEach(() => {
  useCashSessionStore.getState().setSession(null);
});

function makeSession(status: CashSessionStatus = CashSessionStatus.OPEN): CashSessionDto {
  return {
    id:             'session-1',
    branchId:       'branch-1',
    openedBy:       'user-1',
    openedByName:   'Admin',
    closedBy:       null,
    openingAmount:  500,
    closingAmount:  null,
    expectedAmount: null,
    difference:     null,
    status,
    openedAt:       new Date().toISOString(),
    closedAt:       null,
    notes:          null,
  };
}

describe('useCashSessionStore', () => {
  it('estado inicial es null (sin sesión)', () => {
    expect(useCashSessionStore.getState().session).toBeNull();
  });

  it('setSession almacena la sesión correctamente', () => {
    const session = makeSession();
    useCashSessionStore.getState().setSession(session);
    expect(useCashSessionStore.getState().session).toEqual(session);
  });

  it('isOpen() devuelve true cuando la sesión está OPEN', () => {
    useCashSessionStore.getState().setSession(makeSession(CashSessionStatus.OPEN));
    expect(useCashSessionStore.getState().isOpen()).toBe(true);
  });

  it('isOpen() devuelve false cuando la sesión está CLOSED', () => {
    useCashSessionStore.getState().setSession(makeSession(CashSessionStatus.CLOSED));
    expect(useCashSessionStore.getState().isOpen()).toBe(false);
  });
});
