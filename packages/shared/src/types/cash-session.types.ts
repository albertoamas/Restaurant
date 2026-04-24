import { CashSessionStatus } from './enums';

export interface CashSessionDto {
  id: string;
  branchId: string;
  openedBy: string;
  openedByName: string;
  closedBy: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: CashSessionStatus;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  /** Ventas en efectivo durante la sesión. Solo presente en la respuesta de /current (sesión abierta). */
  cashSales?: number;
}

export interface OpenCashSessionRequest {
  openingAmount: number;
  notes?: string;
}

export interface CloseCashSessionRequest {
  closingAmount: number;
  notes?: string;
}
