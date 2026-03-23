import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailGlobal(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
