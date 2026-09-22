import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UserRole } from '@pos/shared';
import { UpdateUserBranchUseCase } from './update-user-branch.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';
import { User } from '../../domain/entities/user.entity';

const TENANT_ID = 'tenant-1';
const USER_ID   = 'user-1';
const BRANCH_ID = 'branch-1';

function makeUser(role: UserRole): User {
  const u = new User();
  u.id = USER_ID;
  u.tenantId = TENANT_ID;
  u.branchId = null;
  u.email = 'cajero@demo.com';
  u.passwordHash = 'hashed';
  u.name = 'Cajero';
  u.role = role;
  u.isActive = true;
  u.createdAt = new Date();
  return u;
}

describe('UpdateUserBranchUseCase', () => {
  let useCase: UpdateUserBranchUseCase;
  let userRepo: MockProxy<UserRepositoryPort>;
  let branchAccess: MockProxy<BranchAccessService>;

  beforeEach(() => {
    userRepo     = mock<UserRepositoryPort>();
    branchAccess = mock<BranchAccessService>();
    useCase      = new UpdateUserBranchUseCase(userRepo, branchAccess);
    userRepo.findById.mockResolvedValue(makeUser(UserRole.CASHIER));
  });

  it('asigna la sucursal cuando el cajero y la sucursal son válidos', async () => {
    await useCase.execute(USER_ID, TENANT_ID, BRANCH_ID);
    expect(branchAccess.assertUsable).toHaveBeenCalledWith(BRANCH_ID, TENANT_ID);
    expect(userRepo.updateBranch).toHaveBeenCalledWith(USER_ID, TENANT_ID, BRANCH_ID);
  });

  it('lanza NotFoundException si el usuario no existe en el tenant', async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(USER_ID, TENANT_ID, BRANCH_ID)).rejects.toThrow(NotFoundException);
    expect(userRepo.updateBranch).not.toHaveBeenCalled();
  });

  it('lanza ForbiddenException si el usuario es OWNER', async () => {
    userRepo.findById.mockResolvedValue(makeUser(UserRole.OWNER));
    await expect(useCase.execute(USER_ID, TENANT_ID, BRANCH_ID)).rejects.toThrow(ForbiddenException);
    expect(userRepo.updateBranch).not.toHaveBeenCalled();
  });

  it('no guarda nada si la sucursal no existe o está desactivada', async () => {
    branchAccess.assertUsable.mockRejectedValue(new BadRequestException('Sucursal no encontrada'));
    await expect(useCase.execute(USER_ID, TENANT_ID, 'branch-ajena')).rejects.toThrow(BadRequestException);
    expect(userRepo.updateBranch).not.toHaveBeenCalled();
  });

  it('desasignar la sucursal (null) no valida ninguna sucursal', async () => {
    await useCase.execute(USER_ID, TENANT_ID, null);
    expect(branchAccess.assertUsable).not.toHaveBeenCalled();
    expect(userRepo.updateBranch).toHaveBeenCalledWith(USER_ID, TENANT_ID, null);
  });
});
