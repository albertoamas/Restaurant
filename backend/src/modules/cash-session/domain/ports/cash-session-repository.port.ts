import { CashSession } from '../entities/cash-session.entity';

export interface CashSessionRepositoryPort {
  save(session: CashSession): Promise<CashSession>;
  findOpenByBranch(tenantId: string, branchId: string): Promise<CashSession | null>;
  findById(id: string, tenantId: string): Promise<CashSession | null>;
  findByBranch(tenantId: string, branchId: string, limit?: number): Promise<CashSession[]>;
  getCashSalesDuringSession(tenantId: string, branchId: string, from: Date): Promise<number>;
}
