export interface DailySeriesItemDto {
  date: string;
  totalSales: number;
  orderCount: number;
}

export interface CashierReportDto {
  userId: string;
  userName: string;
  orderCount: number;
  totalSales: number;
  averageTicket: number;
}

/** Una fila por sucursal activa del tenant, para la comparativa consolidada. */
/**
 * Ventas de una sucursal en un día. Una fila por par (día, sucursal) con
 * movimiento: los días sin ventas no vienen y el cliente los completa en cero.
 * Mismo criterio que `DailySeriesItemDto` — sin cancelados ni cortesías —,
 * así que la suma por sucursal cuadra con `BranchReportDto.totalSales`.
 */
export interface BranchDailySeriesItemDto {
  date: string;
  branchId: string;
  totalSales: number;
  orderCount: number;
}

export interface BranchReportDto {
  branchId: string;
  branchName: string;
  orderCount: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  averageTicket: number;
}

export interface TopCategoryDto {
  categoryId: string | null;
  categoryName: string | null;
  totalQuantity: number;
  totalRevenue: number;
}

export interface HourlyDataDto {
  hour: number;
  totalSales: number;
  orderCount: number;
}

export interface DayHourDataDto {
  dayOfWeek:  number; // 0=Dom, 1=Lun … 6=Sáb  (PostgreSQL EXTRACT DOW)
  hour:       number; // 0–23
  totalSales: number;
  orderCount: number;
}

export interface CashSessionReportItemDto {
  id: string;
  branchId: string;
  branchName: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
}
