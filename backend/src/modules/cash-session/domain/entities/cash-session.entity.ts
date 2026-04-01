import { v4 as uuidv4 } from 'uuid';
import { CashSessionStatus } from '@pos/shared';

export interface CashSessionProps {
  id: string;
  tenantId: string;
  branchId: string;
  openedBy: string;
  closedBy: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: CashSessionStatus;
  openedAt: Date;
  closedAt: Date | null;
  notes: string | null;
}

export class CashSession {
  readonly id: string;
  readonly tenantId: string;
  readonly branchId: string;
  readonly openedBy: string;
  closedBy: string | null;
  readonly openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: CashSessionStatus;
  readonly openedAt: Date;
  closedAt: Date | null;
  notes: string | null;

  private constructor(props: CashSessionProps) {
    Object.assign(this, props);
  }

  static open(props: {
    tenantId: string;
    branchId: string;
    openedBy: string;
    openingAmount: number;
    notes?: string;
  }): CashSession {
    return new CashSession({
      id: uuidv4(),
      tenantId: props.tenantId,
      branchId: props.branchId,
      openedBy: props.openedBy,
      closedBy: null,
      openingAmount: props.openingAmount,
      closingAmount: null,
      expectedAmount: null,
      difference: null,
      status: CashSessionStatus.OPEN,
      openedAt: new Date(),
      closedAt: null,
      notes: props.notes ?? null,
    });
  }

  static reconstitute(props: CashSessionProps): CashSession {
    return new CashSession(props);
  }

  close(closedBy: string, closingAmount: number, cashSales: number, notes?: string): void {
    const expected = this.openingAmount + cashSales;
    this.closedBy = closedBy;
    this.closingAmount = closingAmount;
    this.expectedAmount = expected;
    this.difference = closingAmount - expected;
    this.status = CashSessionStatus.CLOSED;
    this.closedAt = new Date();
    if (notes) this.notes = notes;
  }
}
