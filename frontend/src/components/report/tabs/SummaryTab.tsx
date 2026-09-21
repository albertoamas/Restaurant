import type { DailyReportDto, ExpenseSummaryDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Icon } from '../../ui/Icon';
import { PaymentBar, TypeRow } from '../index';
import { NetProfitDonut } from '../charts/NetProfitDonut';

interface Props {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
}

/** Panorama del período: totales, cómo se cobró y resultado neto. */
export function SummaryTab({ report, expenseSummary }: Props) {
  if (!report) return null;

  const expenses   = expenseSummary?.total ?? 0;
  const netProfit  = report.totalSales - expenses;
  const isPositive = netProfit >= 0;
  const marginPct  = report.totalSales > 0 ? (netProfit / report.totalSales) * 100 : 0;

  return (
    <>
      {expenseSummary !== null && (
        <Card variant="panel" className="mb-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Ganancia Neta</p>
              <p className={`font-heading text-3xl font-black leading-none ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {!isPositive && <span className="mr-0.5 text-xl">−</span>}Bs {Math.abs(netProfit).toFixed(2)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
              isPositive
                ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-600'
                : 'border-red-500/25 bg-red-500/12 text-red-600'
            }`}>
              {isPositive ? '↑' : '↓'} {Math.abs(marginPct).toFixed(1)}% margen
            </span>
          </div>
          <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <NetProfitDonut sales={report.totalSales} expenses={expenses} />
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ingresos</span>
                <span className="font-heading font-bold text-gray-900">Bs {report.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Gastos operativos</span>
                <span className="font-heading font-bold text-red-500">− Bs {expenses.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5 text-sm">
                <span className="font-semibold text-gray-700">Resultado neto</span>
                <span className={`font-heading font-black ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {!isPositive && '− '}Bs {Math.abs(netProfit).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card variant="panel">
          <h3 className="mb-4 font-heading text-sm font-bold text-gray-700">Métodos de Pago</h3>
          <div className="space-y-4">
            <PaymentBar label="Efectivo"      amount={report.paymentBreakdown.cash}     total={report.totalSales} color="bg-emerald-500" />
            <PaymentBar label="QR"            amount={report.paymentBreakdown.qr}       total={report.totalSales} color="bg-primary-500" />
            <PaymentBar label="Transferencia" amount={report.paymentBreakdown.transfer} total={report.totalSales} color="bg-violet-500"  />
            {report.paymentBreakdown.cortesia > 0 && (
              <PaymentBar label="Cortesía" amount={report.paymentBreakdown.cortesia} total={report.totalSales + report.paymentBreakdown.cortesia} color="bg-amber-400" />
            )}
          </div>
        </Card>

        <Card variant="panel">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-gray-700">Tipo de Pedido</h3>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-2.5 py-1 text-xs font-bold text-primary-600">
              <Icon name="orders" size={12} strokeWidth={2.5} />
              {report.orderCount} pedidos
            </span>
          </div>
          <div className="space-y-4">
            <TypeRow label="Local"       count={report.ordersByType.dineIn}   total={report.orderCount} color="bg-primary-500" />
            <TypeRow label="Para Llevar" count={report.ordersByType.takeout}  total={report.orderCount} color="bg-amber-500"   />
            <TypeRow label="Delivery"    count={report.ordersByType.delivery} total={report.orderCount} color="bg-violet-500"  />
          </div>
        </Card>
      </div>
    </>
  );
}
