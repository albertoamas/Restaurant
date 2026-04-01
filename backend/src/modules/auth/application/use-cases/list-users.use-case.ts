import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(tenantId: string) {
    const users = await this.userRepository.findAllByTenant(tenantId);
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      branchId: u.branchId,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }
}
