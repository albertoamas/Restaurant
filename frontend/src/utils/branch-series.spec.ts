import { describe, it, expect } from 'vitest';
import type { BranchReportDto } from '@pos/shared';
import {
  OTHERS_KEY,
  buildBranchSeries,
  dailyBySeries,
  totalsByMetric,
  visibleSeries,
} from './branch-series';

const PALETTE = ['#p1', '#p2', '#p3'];
const GRAY    = '#gray';

function report(branchId: string, totalSales: number, totalExpenses = 0): BranchReportDto {
  return {
    branchId, branchName: branchId, orderCount: 1,
    totalSales, totalExpenses, netProfit: totalSales - totalExpenses, averageTicket: totalSales,
  };
}

describe('buildBranchSeries', () => {
  it('asigna el color por orden de nombre, no por el orden en que llegan', () => {
    const series = buildBranchSeries(
      [{ id: 'b', name: 'Norte' }, { id: 'a', name: 'Centro' }],
      PALETTE, GRAY,
    );
    expect(series.map((s) => [s.name, s.color])).toEqual([['Centro', '#p1'], ['Norte', '#p2']]);
  });

  // El caso que la regla "el color sigue a la entidad" protege: si el color se
  // asignara por ranking de ventas, cambiar de período repintaría las sucursales.
  it('el color de una sucursal no cambia aunque cambie el orden de entrada', () => {
    const a = buildBranchSeries([{ id: 'x', name: 'Sur' }, { id: 'y', name: 'Norte' }], PALETTE, GRAY);
    const b = buildBranchSeries([{ id: 'y', name: 'Norte' }, { id: 'x', name: 'Sur' }], PALETTE, GRAY);
    expect(a).toEqual(b);
  });

  it('con más sucursales que colores agrupa las que sobran en "Otras", en gris', () => {
    const series = buildBranchSeries(
      ['A', 'B', 'C', 'D'].map((n) => ({ id: n, name: n })),
      PALETTE, GRAY,
    );
    expect(series.map((s) => s.key)).toEqual(['A', 'B', OTHERS_KEY]);
    expect(series[2]).toMatchObject({ name: 'Otras (2)', color: GRAY, branchIds: ['C', 'D'] });
  });

  it('nunca repite un color de la paleta ni inventa uno nuevo', () => {
    const series = buildBranchSeries(
      ['A', 'B', 'C', 'D', 'E'].map((n) => ({ id: n, name: n })),
      PALETTE, GRAY,
    );
    const colors = series.map((s) => s.color);
    expect(new Set(colors).size).toBe(colors.length);
    expect(colors.every((c) => PALETTE.includes(c) || c === GRAY)).toBe(true);
  });
});

describe('visibleSeries', () => {
  it('solo deja las series con alguna sucursal presente en el período', () => {
    const series = buildBranchSeries([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], PALETTE, GRAY);
    expect(visibleSeries(series, [report('b', 10)]).map((s) => s.key)).toEqual(['b']);
  });
});

describe('totalsByMetric', () => {
  it('arma una fila por medida con una columna por sucursal', () => {
    const series = buildBranchSeries([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], PALETTE, GRAY);
    const rows = totalsByMetric([report('a', 100, 30), report('b', 50, 70)], series);

    expect(rows).toEqual([
      { metric: 'Ventas',   a: 100, b: 50 },
      { metric: 'Gastos',   a: 30,  b: 70 },
      { metric: 'Ganancia', a: 70,  b: -20 },
    ]);
  });

  it('"Otras" suma todas las sucursales que agrupa', () => {
    const series = buildBranchSeries(
      ['A', 'B', 'C', 'D'].map((n) => ({ id: n, name: n })),
      PALETTE, GRAY,
    );
    const rows = totalsByMetric([report('C', 10), report('D', 15)], series);
    expect(rows[0][OTHERS_KEY]).toBe(25);
  });
});

describe('dailyBySeries', () => {
  it('rellena con 0 los días y sucursales sin ventas', () => {
    const series = buildBranchSeries([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], PALETTE, GRAY);
    const rows = dailyBySeries(
      [{ date: '2026-09-02', branchId: 'a', totalSales: 40, orderCount: 2 }],
      ['2026-09-01', '2026-09-02', '2026-09-03'],
      series,
    );

    expect(rows).toEqual([
      { date: '2026-09-01', a: 0,  b: 0 },
      { date: '2026-09-02', a: 40, b: 0 },
      { date: '2026-09-03', a: 0,  b: 0 },
    ]);
  });

  it('la suma de un día coincide con la suma de sus filas de origen', () => {
    const series = buildBranchSeries([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], PALETTE, GRAY);
    const [row] = dailyBySeries(
      [
        { date: '2026-09-01', branchId: 'a', totalSales: 10.1, orderCount: 1 },
        { date: '2026-09-01', branchId: 'b', totalSales: 20.2, orderCount: 1 },
      ],
      ['2026-09-01'],
      series,
    );
    expect(Number(row.a) + Number(row.b)).toBeCloseTo(30.3, 2);
  });
});
