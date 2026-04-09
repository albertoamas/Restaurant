import { SaasPlan } from '@pos/shared';
import { Plan } from '../entities/plan.entity';

export interface PlanRepositoryPort {
  findAll(): Promise<Plan[]>;
  findById(id: SaasPlan): Promise<Plan | null>;
  update(id: SaasPlan, updates: Partial<Omit<Plan, 'id' | 'limits' | 'withUpdates'>>): Promise<Plan>;
}
