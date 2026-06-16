import { useAuth } from '../context/auth.context';
import { useCashierReport, type CashierPeriod } from '../hooks/useCashierReport';
import { PageShell } from '../components/ui/PageShell';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { StatCard, PaymentBar, TypeRow } from '../components/report';

const PERIODS: { key: CashierPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy'         },
  { key: 'week',  label: 'Esta semana' },
  { key: 'month', label: 'Este mes'    },
];

const pActive   = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
const pInactive = 'bg-white/5 border border-white/10 text-gray-500 hover:border-primary-500/40 hover:text-primary-400';

export function CashierReportPage() {
  const { user } = useAuth();
  const { report, loading, period, setPeriod, rangeLabel, from, to } = useCashierReport();

  const hasData = report && report.orderCount > 0;

  return (
    <PageShell>
      {/* Print header */}
      <div className="hidden print:block mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Rendición — {user?.name}</h1>
        <p className="text-sm text-gray-600 mt-0.5">{rangeLabel}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Generado el {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Header card */}
      <div
        data-print-hide
        className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-4 sm:p-5 mb-5"
        style={{ background: 'var(--color-surface-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">
              Mi Rendición
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.name} · Resumen de ventas atendidas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100/60 border border-primary-500/25 text-primary-400">
              {rangeLabel}
            </span>
            <button
              onClick={() => window.print()}
              disabled={!hasData}
              title="Imprimir / PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-500/8 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icon name="print" size={14} />PDF
            </button>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${period === p.key ? pActive : pInactive}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Icon name="chart" size={44} strokeWidth={1.5} className="mb-3 opacity-35" />
          <p className="text-sm font-semibold text-gray-500">Sin ventas en este período</p>
          <p className="text-xs mt-1">Selecciona otro rango de fechas</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <StatCard
              label="Total Cobrado"
              value={`Bs ${report!.totalSales.toFixed(2)}`}
              icon={<Icon name="dollar" size={24} />}
              accent="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <StatCard
              label="Pedidos Atendidos"
              value={String(report!.orderCount)}
              icon={<Icon name="orders" size={24} />}
              accent="text-primary-400"
              bg="bg-primary-500/10"
            />
            <StatCard
              label="Ticket Promedio"
              value={`Bs ${report!.averageTicket.toFixed(2)}`}
              icon={<Icon name="receipt" size={24} />}
              accent="text-violet-400"
              bg="bg-violet-500/10"
            />
          </div>

          {/* Payment & Type breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card variant="panel">
              <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Métodos de Pago</h3>
              <div className="space-y-4">
                <PaymentBar
                  label="Efectivo"
                  amount={report!.paymentBreakdown.cash}
                  total={report!.totalSales}
                  color="bg-emerald-500"
                />
                <PaymentBar
                  label="QR"
                  amount={report!.paymentBreakdown.qr}
                  total={report!.totalSales}
                  color="bg-primary-500"
                />
                <PaymentBar
                  label="Transferencia"
                  amount={report!.paymentBreakdown.transfer}
                  total={report!.totalSales}
                  color="bg-violet-500"
                />
                {report!.paymentBreakdown.cortesia > 0 && (
                  <PaymentBar
                    label="Cortesía"
                    amount={report!.paymentBreakdown.cortesia}
                    total={report!.totalSales + report!.paymentBreakdown.cortesia}
                    color="bg-amber-400"
                  />
                )}
              </div>
            </Card>

            <Card variant="panel">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 font-heading">Tipo de Pedido</h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-primary-600 border border-primary-500/20">
                  <Icon name="orders" size={12} strokeWidth={2.5} />
                  {report!.orderCount} pedidos
                </span>
              </div>
              <div className="space-y-4">
                <TypeRow
                  label="Local"
                  count={report!.ordersByType.dineIn}
                  total={report!.orderCount}
                  color="bg-primary-500"
                />
                <TypeRow
                  label="Para Llevar"
                  count={report!.ordersByType.takeout}
                  total={report!.orderCount}
                  color="bg-amber-500"
                />
                <TypeRow
                  label="Delivery"
                  count={report!.ordersByType.delivery}
                  total={report!.orderCount}
                  color="bg-violet-500"
                />
              </div>
            </Card>
          </div>

          {/* Print-only totals table */}
          <div className="hidden print:block mt-8">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-600">Total cobrado</td>
                  <td className="py-2 text-right font-bold text-gray-900">
                    Bs {report!.totalSales.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-600">Pedidos atendidos</td>
                  <td className="py-2 text-right font-bold text-gray-900">{report!.orderCount}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-600">Efectivo</td>
                  <td className="py-2 text-right font-bold text-gray-900">
                    Bs {report!.paymentBreakdown.cash.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-600">QR</td>
                  <td className="py-2 text-right font-bold text-gray-900">
                    Bs {report!.paymentBreakdown.qr.toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-600">Transferencia</td>
                  <td className="py-2 text-right font-bold text-gray-900">
                    Bs {report!.paymentBreakdown.transfer.toFixed(2)}
                  </td>
                </tr>
                {report!.paymentBreakdown.cortesia > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">Cortesía</td>
                    <td className="py-2 text-right font-bold text-gray-900">
                      Bs {report!.paymentBreakdown.cortesia.toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Período: {from === to ? from : `${from} al ${to}`}
            </p>
          </div>
        </>
      )}
    </PageShell>
  );
}
