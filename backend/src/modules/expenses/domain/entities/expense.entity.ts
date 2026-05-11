import { ExpenseItemDto } from '@pos/shared';
import { randomUUID } from 'crypto';

interface ExpenseItemProps {
  id: string;
  expenseId: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ExpenseProps {
  id: string;
  tenantId: string;
  branchId: string;
  category: string;
  amount: number;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  cashSessionId: string | null;
  items: ExpenseItemProps[];
}

export class Expense {
  readonly id: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly category: string;
  readonly amount: number;
  readonly description: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly cashSessionId: string | null;
  readonly items: ExpenseItemDto[];

  private constructor(props: ExpenseProps) {
    this.id            = props.id;
    this.tenantId      = props.tenantId;
    this.branchId      = props.branchId;
    this.category      = props.category;
    this.amount        = props.amount;
    this.description   = props.description ?? null;
    this.createdBy     = props.createdBy;
    this.createdAt     = props.createdAt;
    this.cashSessionId = props.cashSessionId ?? null;
    this.items         = props.items.map((i) => ({
      id:           i.id,
      categoryId:   i.categoryId,
      categoryName: i.categoryName,
      name:         i.name,
      quantity:     i.quantity,
      unitPrice:    i.unitPrice,
      totalPrice:   i.totalPrice,
    }));
  }

  static create(props: Omit<ExpenseProps, 'id' | 'createdAt'>): Expense {
    return new Expense({ ...props, id: randomUUID(), createdAt: new Date() });
  }

  static reconstitute(props: ExpenseProps): Expense {
    return new Expense(props);
  }
}
