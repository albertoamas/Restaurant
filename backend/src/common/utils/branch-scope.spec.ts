import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { assertBranchAccess, scopedBranchId } from './branch-scope';
import { JwtPayload } from '../decorators/tenant.decorator';

const owner   = { sub: 'o', tenantId: 't', branchId: null, role: UserRole.OWNER } as JwtPayload;
const cashier = { sub: 'c', tenantId: 't', branchId: 'b1', role: UserRole.CASHIER } as JwtPayload;
const sinSucursal = { ...cashier, branchId: null } as JwtPayload;

describe('scopedBranchId', () => {
  it('el dueño usa la sucursal que pide, o ninguna (todas)', () => {
    expect(scopedBranchId(owner, 'b2')).toBe('b2');
    expect(scopedBranchId(owner)).toBeUndefined();
  });

  it('el cajero usa siempre la suya, aunque pida otra', () => {
    expect(scopedBranchId(cashier, 'b2')).toBe('b1');
  });

  it('un cajero sin sucursal no opera, aunque mande una', () => {
    expect(() => scopedBranchId(sinSucursal, 'b2')).toThrow(ForbiddenException);
  });
});

describe('assertBranchAccess', () => {
  it('el dueño accede a cualquier sucursal', () => {
    expect(() => assertBranchAccess(owner, 'b2', 'ver')).not.toThrow();
  });

  it('el cajero solo a la suya', () => {
    expect(() => assertBranchAccess(cashier, 'b1', 'ver')).not.toThrow();
    expect(() => assertBranchAccess(cashier, 'b2', 'cobrar')).toThrow('No tienes permisos para cobrar pedidos de otra sucursal');
  });

  it('un cajero sin sucursal no accede a ninguna', () => {
    expect(() => assertBranchAccess(sinSucursal, 'b1', 'ver')).toThrow(ForbiddenException);
  });
});
