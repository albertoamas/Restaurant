import { Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan } from '@pos/shared';
import { Plan } from '../../domain/entities/plan.entity';
import { PlanRepositoryPort } from '../../domain/ports/plan-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';

function toDomain(row: any): Plan {
  return new Plan(
    row.id as SaasPlan,
    row.displayName,
    Number(row.priceBs),
    row.maxBranches,
    row.maxCashiers,
    row.maxProducts,
    row.kitchenEnabled,
    row.rafflesEnabled,
  );
}

@Injectable()
export class PlanRepository implements PlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Plan[]> {
    const rows = await this.prisma.plan.findMany({ orderBy: { priceBs: 'asc' } });
    return rows.map(toDomain);
  }

  async findById(id: SaasPlan): Promise<Plan | null> {
    const row = await this.prisma.plan.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async update(id: SaasPlan, updates: Partial<Omit<Plan, 'id' | 'limits' | 'withUpdates'>>): Promise<Plan> {
    const existing = await this.prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Plan ${id} not found`);

    const row = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(updates.displayName    !== undefined && { displayName:    updates.displayName }),
        ...(updates.priceBs        !== undefined && { priceBs:        updates.priceBs }),
        ...(updates.maxBranches    !== undefined && { maxBranches:    updates.maxBranches }),
        ...(updates.maxCashiers    !== undefined && { maxCashiers:    updates.maxCashiers }),
        ...(updates.maxProducts    !== undefined && { maxProducts:    updates.maxProducts }),
        ...(updates.kitchenEnabled !== undefined && { kitchenEnabled: updates.kitchenEnabled }),
        ...(updates.rafflesEnabled !== undefined && { rafflesEnabled: updates.rafflesEnabled }),
      },
    });
    return toDomain(row);
  }
}
