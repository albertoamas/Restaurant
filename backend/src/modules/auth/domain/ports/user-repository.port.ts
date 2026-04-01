import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  findAllByTenant(tenantId: string): Promise<User[]>;
  save(user: User): Promise<User>;
  updatePassword(userId: string, tenantId: string, newPasswordHash: string): Promise<void>;
  updateBranch(userId: string, tenantId: string, branchId: string | null): Promise<void>;
}
