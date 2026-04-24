import * as XLSX from 'xlsx';
import type { DailyReportDto, TopProductDto, TopCustomerDto, ExpenseSummaryDto } from '@pos/shared';
import { ExpenseCategory } from '@pos/shared';

const EXPENSE_LABELS: Partial<Record<ExpenseCategory, string>> = {
  [ExpenseCategory.SUPPLIES]:    'Insumos',
  [ExpenseCategory.WAGES]:       'Personal',
  [ExpenseCategory.UTILITIES]:   'Servicios',
  [ExpenseCategory.TRANSPORT]:   'Transporte',
  [ExpenseCategory.MAINTENANCE]: 'Mantenimiento',
  [ExpenseCategory.OTHER]:       'Otro',
};

function col(width: number): XLSX.ColInfo {
  return { wch: width };
}

function buildSummarySheet(
  report: DailyReportDto,
  rangeLabel: string,
  expenseSummary: ExpenseSummaryDto | null,
): XLSX.WorkSheet {
  const totalExpenses = expenseSummary?.total ?? 0;
  const netProfit = report.totalSales - totalExpenses;

  const rows: (string | number)[][] = [
    ['Período', rangeLabel],
    [],
    ['VENTAS GENERALES'],
    ['Concepto', 'Valor'],
    ['Ventas Totales (Bs)', report.totalSales],
    ['Pedidos', report.orderCount],
    ['Ticket Promedio (Bs)', report.averageTicket],
    [],
    ['MÉTODOS DE PAGO'],
    ['Método', 'Monto (Bs)'],
    ['Efectivo', report.paymentBreakdown.cash],
    ['QR', report.paymentBreakdown.qr],
    ['Transferencia', report.paymentBreakdown.transfer],
    ['Cortesía', report.paymentBreakdown.cortesia],
    [],
    ['TIPOS DE PEDIDO'],
    ['Tipo', 'Cantidad'],
    ['Local / Mesa', report.ordersByType.dineIn],
    ['Para Llevar', report.ordersByType.takeout],
    ['Delivery', report.ordersByType.delivery],
    [],
    ['GASTOS Y GANANCIA'],
    ['Concepto', 'Monto (Bs)'],
    ['Total Gastos', totalExpenses],
    ['Ganancia Neta', netProfit],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [col(28), col(20)];
  return ws;
}

function buildProductsSheet(products: TopProductDto[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ['Posición', 'Producto', 'Categoría', 'Unidades', 'Ingresos (Bs)'],
    ...products.map((p, i) => [i + 1, p.productName, p.categoryName ?? '—', p.totalQuantity, p.totalRevenue]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [col(8), col(30), col(18), col(10), col(14)];
  return ws;
}

function buildCustomersSheet(customers: TopCustomerDto[]): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ['Posición', 'Cliente', 'Teléfono', 'Pedidos', 'Total Gastado (Bs)'],
    ...customers.map((c, i) => [i + 1, c.customerName, c.customerPhone ?? '—', c.orderCount, c.totalSpent]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [col(8), col(28), col(16), col(10), col(18)];
  return ws;
}

function buildExpensesSheet(summary: ExpenseSummaryDto): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ['Categoría', 'Monto (Bs)'],
    ...(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => [EXPENSE_LABELS[cat] ?? cat, amount]),
    [],
    ['TOTAL', summary.total],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [col(20), col(14)];
  return ws;
}

export function downloadExcel(
  rangeLabel: string,
  report: DailyReportDto,
  topProducts: TopProductDto[],
  topCustomers: TopCustomerDto[],
  expenseSummary: ExpenseSummaryDto | null,
  filename: string,
): void {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildSummarySheet(report, rangeLabel, expenseSummary), 'Resumen');
  if (topProducts.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildProductsSheet(topProducts), 'Productos');
  }
  if (topCustomers.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildCustomersSheet(topCustomers), 'Clientes');
  }
  if (expenseSummary && expenseSummary.total > 0) {
    XLSX.utils.book_append_sheet(wb, buildExpensesSheet(expenseSummary), 'Gastos');
  }

  XLSX.writeFile(wb, filename);
}
