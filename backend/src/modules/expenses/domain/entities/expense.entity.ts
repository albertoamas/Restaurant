import { ExpenseItemDto, ExpenseStatus, PaymentMethod } from '@pos/shared';
import { randomUUID } from 'crypto';

interface ExpenseItemProps {
  id: string;
  expenseId: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  unit: string | null;
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
  expenseDate: Date;
  status: ExpenseStatus;
  paymentMethod: PaymentMethod | null;
  supplierName: string | null;
  documentNumber: string | null;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
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
  readonly expenseDate: Date;
  readonly status: ExpenseStatus;
  readonly paymentMethod: PaymentMethod | null;
  readonly supplierName: string | null;
  readonly documentNumber: string | null;
  readonly voidedAt: Date | null;
  readonly voidedBy: string | null;
  readonly voidReason: string | null;
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
    this.expenseDate   = props.expenseDate;
    this.status        = props.status;
    this.paymentMethod = props.paymentMethod ?? null;
    this.supplierName  = props.supplierName ?? null;
    this.documentNumber = props.documentNumber ?? null;
    this.voidedAt      = props.voidedAt ?? null;
    this.voidedBy      = props.voidedBy ?? null;
    this.voidReason    = props.voidReason ?? null;
    this.cashSessionId = props.cashSessionId ?? null;
    this.items         = props.items.map((i) => ({
      id:           i.id,
      categoryId:   i.categoryId,
      categoryName: i.categoryName,
      name:         i.name,
      unit:         i.unit,
      quantity:     i.quantity,
      unitPrice:    i.unitPrice,
      totalPrice:   i.totalPrice,
    }));
  }

  static create(props: Omit<ExpenseProps, 'id' | 'createdAt' | 'status' | 'voidedAt' | 'voidedBy' | 'voidReason'>): Expense {
    return new Expense({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      status: 'ACTIVE',
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
    });
  }

  static reconstitute(props: ExpenseProps): Expense {
    return new Expense(props);
  }
}
