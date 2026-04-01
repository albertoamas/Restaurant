import { ExpenseCategory } from '@pos/shared';
import { randomUUID } from 'crypto';

interface ExpenseProps {
  id: string;
  tenantId: string;
  branchId: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  createdBy: string;
  createdAt: Date;
}

export class Expense {
  readonly id: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly category: ExpenseCategory;
  readonly amount: number;
  readonly description: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;

  private constructor(props: ExpenseProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.branchId = props.branchId;
    this.category = props.category;
    this.amount = props.amount;
    this.description = props.description ?? null;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt;
  }

  static create(props: Omit<ExpenseProps, 'id' | 'createdAt'>): Expense {
    return new Expense({ ...props, id: randomUUID(), createdAt: new Date() });
  }

  static reconstitute(props: ExpenseProps): Expense {
    return new Expense(props);
  }
}
