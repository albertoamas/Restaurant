import { Injectable } from '@nestjs/common';
import { ExpenseConcept as PrismaExpenseConcept } from '@prisma/client';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';
import { ExpenseConceptRepositoryPort } from '../../domain/ports/expense-concept-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';

function toDomain(row: PrismaExpenseConcept): ExpenseConceptEntity {
  return ExpenseConceptEntity.reconstitute({
    id:               row.id,
    tenantId:         row.tenantId,
    categoryId:       row.categoryId,
    name:             row.name,
    unit:             row.unit ?? null,
    defaultUnitPrice: row.defaultUnitPrice === null ? null : Number(row.defaultUnitPrice),
    isActive:         row.isActive,
    sortOrder:        row.sortOrder,
    createdAt:        row.createdAt,
  });
}

@Injectable()
export class ExpenseConceptRepository implements ExpenseConceptRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<ExpenseConceptEntity[]> {
    const rows = await this.prisma.expenseConcept.findMany({
      where:   { tenantId, isActive: true, category: { isActive: true } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findById(id: string, tenantId: string): Promise<ExpenseConceptEntity | null> {
    const row = await this.prisma.expenseConcept.findFirst({ where: { id, tenantId } });
    return row ? toDomain(row) : null;
  }

  async findByName(tenantId: string, name: string): Promise<ExpenseConceptEntity | null> {
    const row = await this.prisma.expenseConcept.findFirst({
      where: { tenantId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? toDomain(row) : null;
  }

  count(tenantId: string): Promise<number> {
    return this.prisma.expenseConcept.count({ where: { tenantId } });
  }

  async save(concept: ExpenseConceptEntity): Promise<ExpenseConceptEntity> {
    const row = await this.prisma.expenseConcept.create({
      data: {
        id:               concept.id,
        tenantId:         concept.tenantId,
        categoryId:       concept.categoryId,
        name:             concept.name,
        unit:             concept.unit,
        defaultUnitPrice: concept.defaultUnitPrice,
        isActive:         concept.isActive,
        sortOrder:        concept.sortOrder,
        createdAt:        concept.createdAt,
      },
    });
    return toDomain(row);
  }

  async update(concept: ExpenseConceptEntity): Promise<ExpenseConceptEntity> {
    const row = await this.prisma.expenseConcept.update({
      where: { id: concept.id },
      data: {
        categoryId:       concept.categoryId,
        name:             concept.name,
        unit:             concept.unit,
        defaultUnitPrice: concept.defaultUnitPrice,
        isActive:         concept.isActive,
        sortOrder:        concept.sortOrder,
      },
    });
    return toDomain(row);
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await this.prisma.expenseConcept.updateMany({
      where: { id, tenantId },
      data:  { isActive: false },
    });
  }

  async saveMany(concepts: ExpenseConceptEntity[]): Promise<void> {
    if (concepts.length === 0) return;
    await this.prisma.expenseConcept.createMany({
      data: concepts.map((c) => ({
        id:               c.id,
        tenantId:         c.tenantId,
        categoryId:       c.categoryId,
        name:             c.name,
        unit:             c.unit,
        defaultUnitPrice: c.defaultUnitPrice,
        isActive:         c.isActive,
        sortOrder:        c.sortOrder,
        createdAt:        c.createdAt,
      })),
      skipDuplicates: true,
    });
  }
}
