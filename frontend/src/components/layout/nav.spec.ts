import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavGroups } from './nav';

const state = vi.hoisted(() => ({
  role: 'OWNER' as 'OWNER' | 'CASHIER',
  modules: { kitchenEnabled: true, ordersEnabled: true, cashEnabled: true, teamEnabled: true, branchesEnabled: true, rafflesEnabled: true },
}));

vi.mock('../../context/auth.context', () => ({ useAuth: () => ({ user: { role: state.role } }) }));
vi.mock('../../store/settings.store', () => ({ useSettingsStore: () => state.modules }));

const routes = () => renderHook(() => useNavGroups()).result.current.flat().map((i) => i.to);

describe('useNavGroups', () => {
  beforeEach(() => {
    state.role = 'OWNER';
    Object.keys(state.modules).forEach((k) => { state.modules[k as keyof typeof state.modules] = true; });
  });

  it('el dueño ve operación, gestión y administración, en ese orden', () => {
    expect(routes()).toEqual([
      '/pos', '/kitchen', '/orders', '/cash',
      '/report', '/expenses', '/customers', '/raffles', '/products',
      '/team', '/branches', '/settings',
    ]);
  });

  it('el cajero ve la operación y su rendición, nunca Configuración', () => {
    state.role = 'CASHIER';
    expect(routes()).toEqual(['/pos', '/kitchen', '/orders', '/cash', '/mi-reporte']);
  });

  it('un módulo deshabilitado desaparece del menú', () => {
    state.modules.kitchenEnabled = false;
    state.modules.rafflesEnabled = false;
    state.modules.teamEnabled = false;
    const r = routes();
    expect(r).not.toContain('/kitchen');
    expect(r).not.toContain('/raffles');
    expect(r).not.toContain('/team');
    expect(r).toContain('/settings');
  });
});
