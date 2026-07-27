import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { User as PrismaUser } from '@prisma/client';
import { UserRole } from '@pos/shared';

function toDomain(row: PrismaUser): User {
  const user = new User();
  user.id = row.id;
  user.tenantId = row.tenantId;
  user.branchId = row.branchId;
  user.email = row.email;
  user.passwordHash = row.passwordHash;
  user.name = row.name;
  user.role = row.role as UserRole;
  user.isActive = row.isActive;
  user.createdAt = row.createdAt;
  return user;
}

@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { id, tenantId } });
    return row ? toDomain(row) : null;
  }

  async findByIdGlobal(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
    return row ? toDomain(row) : null;
  }

  async findByEmailGlobal(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async countCashiersByTenant(tenantId: string): Promise<number> {
    return this.prisma.user.count({ where: { tenantId, role: 'CASHIER', isActive: true } });
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDomain);
  }

  async save(user: User): Promise<User> {
    const data = {
      id: user.id,
      tenantId: user.tenantId,
      branchId: user.branchId,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }

  async updatePassword(userId: string, tenantId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { passwordHash: newPasswordHash },
    });
  }

  async updatePasswordAdmin(userId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  async updateProfile(
    userId: string,
    tenantId: string,
    data: { name?: string; email?: string },
  ): Promise<User> {
    await this.prisma.user.updateMany({
      where: { id: userId, tenantId },
      data,
    });
    const row = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    return toDomain(row!);
  }

  async updateBranch(userId: string, tenantId: string, branchId: string | null): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, tenantId },
      data: { branchId },
    });
  }
}
