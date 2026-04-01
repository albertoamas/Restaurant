import { Branch } from '../entities/branch.entity';

export interface BranchRepositoryPort {
  findById(id: string, tenantId: string): Promise<Branch | null>;
  findAllByTenant(tenantId: string): Promise<Branch[]>;
  save(branch: Branch): Promise<Branch>;
}
