import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByIdGlobal(id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  findAllByTenant(tenantId: string): Promise<User[]>;
  countCashiersByTenant(tenantId: string): Promise<number>;
  save(user: User): Promise<User>;
  updatePassword(userId: string, tenantId: string, newPasswordHash: string): Promise<void>;
  updatePasswordAdmin(userId: string, newPasswordHash: string): Promise<void>;
  updateProfile(userId: string, tenantId: string, data: { name?: string; email?: string }): Promise<User>;
  updateBranch(userId: string, tenantId: string, branchId: string | null): Promise<void>;
}
