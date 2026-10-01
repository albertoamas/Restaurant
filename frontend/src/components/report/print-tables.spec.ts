import { describe, it, expect } from 'vitest';
import type { CashSessionReportItemDto, ExpenseSummaryDto } from '@pos/shared';
import { buildPrintTables, type ReportPrintData } from './print-tables';

const empty: ReportPrintData = {
  report: null, expenseSummary: null, dailySeries: [], byBranch: [],
  byCashier: [], cashSessions: [], topProducts: [], topCustomers: [],
};

describe('buildPrintTables', () => {
  it('gastos: categorías de mayor a menor y fila de total', () => {
    const expenseSummary = { total: 100, transactionCount: 3, byCategory: { A: 30, B: 70, C: 0 }, byDay: {} } as unknown as ExpenseSummaryDto;
    const [t] = buildPrintTables('gastos', { ...empty, expenseSummary });
    expect(t.rows.map((r) => r[1])).toEqual(['Bs 70.00', 'Bs 30.00', 'Bs 100.00']);
    expect(t.rows.at(-1)?.[0]).toBe('Total');
  });

  it('caja: el resultado del cierre en palabras', () => {
    const s = { id: '1', branchName: 'Principal', openedAt: '2026-09-29T12:00:00Z', closedAt: '2026-09-29T23:00:00Z', openingAmount: 200, expectedAmount: 500, closingAmount: 498, difference: -2 } as CashSessionReportItemDto;
    const [, closings] = buildPrintTables('caja', { ...empty, cashSessions: [s] });
    expect(closings.rows[0].at(-1)).toBe('Faltó Bs 2.00');
  });

  it('sin datos cargados no arma tablas de resumen', () => {
    expect(buildPrintTables('resumen', empty)).toEqual([]);
  });
});
