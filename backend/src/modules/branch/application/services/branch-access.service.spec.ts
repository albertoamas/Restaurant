import { BadRequestException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { BranchAccessService } from './branch-access.service';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { Branch } from '../../domain/entities/branch.entity';

const TENANT_ID = 'tenant-1';
const BRANCH_ID = 'branch-1';

function makeBranch(isActive = true): Branch {
  return Branch.reconstitute({
    id: BRANCH_ID, tenantId: TENANT_ID, name: 'Principal',
    address: null, phone: null, isActive, createdAt: new Date(),
  });
}

describe('BranchAccessService', () => {
  let service: BranchAccessService;
  let repo: MockProxy<BranchRepositoryPort>;

  beforeEach(() => {
    repo    = mock<BranchRepositoryPort>();
    service = new BranchAccessService(repo);
  });

  describe('assertBelongsToTenant', () => {
    it('devuelve la sucursal cuando existe en el tenant', async () => {
      repo.findById.mockResolvedValue(makeBranch());
      await expect(service.assertBelongsToTenant(BRANCH_ID, TENANT_ID)).resolves.toBeInstanceOf(Branch);
      expect(repo.findById).toHaveBeenCalledWith(BRANCH_ID, TENANT_ID);
    });

    it('lanza BadRequestException si la sucursal no existe o es de otro tenant', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.assertBelongsToTenant(BRANCH_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    });

    it('acepta una sucursal desactivada (cerrar caja debe seguir siendo posible)', async () => {
      repo.findById.mockResolvedValue(makeBranch(false));
      await expect(service.assertBelongsToTenant(BRANCH_ID, TENANT_ID)).resolves.toBeDefined();
    });
  });

  describe('assertUsable', () => {
    it('devuelve la sucursal cuando existe y está activa', async () => {
      repo.findById.mockResolvedValue(makeBranch());
      await expect(service.assertUsable(BRANCH_ID, TENANT_ID)).resolves.toBeDefined();
    });

    it('lanza BadRequestException si la sucursal está desactivada', async () => {
      repo.findById.mockResolvedValue(makeBranch(false));
      await expect(service.assertUsable(BRANCH_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si la sucursal es de otro tenant', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.assertUsable(BRANCH_ID, 'tenant-ajeno')).rejects.toThrow(BadRequestException);
    });
  });
});
