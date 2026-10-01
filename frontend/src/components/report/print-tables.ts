import { OrderType } from '@pos/shared';
import type {
  BranchReportDto, CashierReportDto, CashSessionReportItemDto, DailyReportDto,
  DailySeriesItemDto, ExpenseSummaryDto, TopCustomerDto, TopProductDto,
} from '@pos/shared';
import type { PrintTable } from '../../utils/report-print';
import { orderTypeLabels } from '../../utils/order';
import { legacyExpenseLabel } from '../../utils/expense-labels';
import { formatBoliviaDateShort, formatBoliviaTime, formatDayRange } from '../../utils/date';
import { cashResult } from '../cash/cash-result';
import { bs, share } from './index';

const pct = (part: number, total: number) => `${share(part, total).toFixed(0)}%`;
const opt = (n: number | null) => (n == null ? '-' : bs(n));
const when = (iso: string) => `${formatBoliviaDateShort(iso)}, ${formatBoliviaTime(iso)}`;

export interface ReportPrintData {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
  dailySeries: DailySeriesItemDto[];
  byBranch: BranchReportDto[];
  byCashier: CashierReportDto[];
  cashSessions: CashSessionReportItemDto[];
  topProducts: TopProductDto[];
  topCustomers: TopCustomerDto[];
}

function keyFigures(r: DailyReportDto, e: ExpenseSummaryDto | null): PrintTable {
  const expenses = e?.total ?? 0;
  const net = r.totalSales - expenses;
  return {
    heading: 'Cifras del período',
    columns: ['Concepto', 'Valor'],
    numeric: [1],
    rows: [
      ['Ventas', bs(r.totalSales)],
      ['Gastos', e ? bs(expenses) : '-'],
      ['Ganancia neta', `${net < 0 ? '-' : ''}${bs(Math.abs(net))}`],
      ['Pedidos', String(r.orderCount)],
      ['Ticket promedio', bs(r.averageTicket)],
    ],
  };
}

/** Tablas que se imprimen para cada sección: las mismas cifras que se ven, sin gráficos. */
export function buildPrintTables(tab: string, d: ReportPrintData): PrintTable[] {
  const r = d.report;
  switch (tab) {
    case 'resumen': {
      if (!r) return [];
      const p = r.paymentBreakdown;
      return [
        keyFigures(r, d.expenseSummary),
        {
          heading: 'Cómo se cobró',
          columns: ['Método', 'Monto', '%'],
          numeric: [1, 2],
          rows: [
            ['Efectivo', bs(p.cash), pct(p.cash, r.totalSales)],
            ['QR', bs(p.qr), pct(p.qr, r.totalSales)],
            ['Transferencia', bs(p.transfer), pct(p.transfer, r.totalSales)],
            ...(p.cortesia > 0 ? [['Cortesías (no suman)', bs(p.cortesia), '-']] : []),
          ],
        },
        {
          heading: 'Tipo de pedido',
          columns: ['Tipo', 'Pedidos', '%'],
          numeric: [1, 2],
          rows: ([
            [OrderType.DINE_IN, r.ordersByType.dineIn],
            [OrderType.TAKEOUT, r.ordersByType.takeout],
            [OrderType.DELIVERY, r.ordersByType.delivery],
          ] as [OrderType, number][]).map(([t, n]) => [orderTypeLabels[t], String(n), pct(n, r.orderCount)]),
        },
      ];
    }
    case 'ventas':
      return [
        ...(r ? [keyFigures(r, d.expenseSummary)] : []),
        {
          heading: 'Ventas por día',
          columns: ['Día', 'Ventas', 'Pedidos'],
          numeric: [1, 2],
          rows: d.dailySeries.map((s) => [formatDayRange(s.date, s.date), bs(s.totalSales), String(s.orderCount)]),
        },
      ];
    case 'sucursales':
      return [{
        heading: 'Detalle por sucursal',
        columns: ['Sucursal', 'Ventas', 'Gastos', 'Ganancia', 'Pedidos', 'Ticket promedio'],
        numeric: [1, 2, 3, 4, 5],
        rows: d.byBranch.map((b) => [
          b.branchName, bs(b.totalSales), bs(b.totalExpenses),
          `${b.netProfit < 0 ? '-' : ''}${bs(Math.abs(b.netProfit))}`, String(b.orderCount), bs(b.averageTicket),
        ]),
      }];
    case 'gastos': {
      const e = d.expenseSummary;
      if (!e) return [];
      return [{
        heading: 'Gastos por categoría',
        columns: ['Categoría', 'Monto', '%'],
        numeric: [1, 2],
        rows: [
          ...(Object.entries(e.byCategory) as [string, number][])
            .filter(([, n]) => n > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, n]) => [legacyExpenseLabel(cat), bs(n), pct(n, e.total)]),
          ['Total', bs(e.total), '100%'],
        ],
      }];
    }
    case 'caja':
      return [
        {
          heading: 'Ventas por cajero',
          columns: ['Cajero', 'Pedidos', 'Ventas'],
          numeric: [1, 2],
          rows: [...d.byCashier].sort((a, b) => b.totalSales - a.totalSales)
            .map((c) => [c.userName, String(c.orderCount), bs(c.totalSales)]),
        },
        {
          heading: 'Cierres de caja',
          columns: ['Sucursal', 'Apertura', 'Cierre', 'Inicial', 'Esperado', 'Contado', 'Resultado'],
          numeric: [3, 4, 5],
          rows: d.cashSessions.map((s) => [
            s.branchName, when(s.openedAt), s.closedAt ? when(s.closedAt) : 'Abierta',
            bs(s.openingAmount), opt(s.expectedAmount), opt(s.closingAmount),
            s.difference == null ? '-' : cashResult(s.difference).label,
          ]),
        },
      ];
    case 'productos':
      return [{
        heading: 'Productos más vendidos',
        columns: ['#', 'Producto', 'Categoría', 'Unidades', 'Ingresos'],
        numeric: [0, 3, 4],
        rows: d.topProducts.map((p, i) => [String(i + 1), p.productName, p.categoryName ?? '-', String(p.totalQuantity), bs(p.totalRevenue)]),
      }];
    case 'clientes':
      return [{
        heading: 'Clientes que más compraron',
        columns: ['#', 'Cliente', 'Teléfono', 'Pedidos', 'Gastado'],
        numeric: [0, 3, 4],
        rows: d.topCustomers.map((c, i) => [String(i + 1), c.customerName, c.customerPhone ?? '-', String(c.orderCount), bs(c.totalSpent)]),
      }];
    default:
      return [];
  }
}
