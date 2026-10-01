import { OrderType, UserRole } from '@pos/shared';
import type { DailyReportDto } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { useCashierReport, type CashierPeriod } from '../hooks/useCashierReport';
import { useBranchNames } from '../hooks/useBranches';
import { PageShell } from '../components/ui/PageShell';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/EmptyState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { printCashierReport } from '../utils/print';
import { orderTypeLabels } from '../utils/order';

const PERIODS: { value: CashierPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week',  label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
];

const money = (n: number) => `Bs ${n.toFixed(2)}`;
const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Lo que el cajero entrega: el efectivo, en grande; lo demás ya está en la cuenta del negocio. */
function ToHandIn({ report }: { report: DailyReportDto }) {
  const p = report.paymentBreakdown;
  return (
    <Card>
      <p className="text-label font-semibold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1.5">
        <Icon name="cash" size={16} />
        Efectivo a entregar
      </p>
      <p className="mt-1 text-display font-bold text-main font-heading tabular-nums">{money(p.cash)}</p>
      <p className="text-label text-soft">Es lo que debe haber en efectivo por las ventas del período.</p>

      <dl className="mt-5 divide-y divide-line border-t border-line">
        <Row label="QR" hint="Ya está en la cuenta" value={money(p.qr)} />
        <Row label="Transferencia" hint="Ya está en la cuenta" value={money(p.transfer)} />
        <div className="flex items-baseline justify-between gap-3 pt-3">
          <dt className="text-body font-semibold text-main">Total cobrado</dt>
          <dd className="text-heading font-bold text-main tabular-nums">{money(report.totalSales)}</dd>
        </div>
      </dl>

      {p.cortesia > 0 && (
        <p className="mt-3 rounded-control bg-surface-2 border border-line px-3 py-2 text-label text-soft">
          Cortesías por <span className="font-semibold text-main tabular-nums">{money(p.cortesia)}</span>: no suman al total cobrado.
        </p>
      )}
    </Card>
  );
}

function Row({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-body text-main">
        {label} <span className="text-caption text-muted">{hint}</span>
      </dt>
      <dd className="text-body font-semibold text-main tabular-nums">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="sm">
      <p className="text-label text-soft">{label}</p>
      <p className="mt-0.5 text-heading font-bold text-main font-heading tabular-nums whitespace-nowrap">{value}</p>
    </Card>
  );
}

function OrderTypes({ report }: { report: DailyReportDto }) {
  const rows: { type: OrderType; count: number }[] = [
    { type: OrderType.DINE_IN,  count: report.ordersByType.dineIn },
    { type: OrderType.TAKEOUT,  count: report.ordersByType.takeout },
    { type: OrderType.DELIVERY, count: report.ordersByType.delivery },
  ];
  return (
    <Card>
      <h2 className="text-heading font-semibold text-main">Tipo de pedido</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.type}>
            <div className="flex items-baseline justify-between gap-3 text-body">
              <span className="text-main">{orderTypeLabels[r.type]}</span>
              <span className="text-soft tabular-nums">
                <span className="font-semibold text-main">{r.count}</span> ({pct(r.count, report.orderCount)}%)
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct(r.count, report.orderCount)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CashierReportPage() {
  const { user, currentBranchId } = useAuth();
  const { branchName } = useBranchNames();
  const { report, loading, period, setPeriod, rangeLabel } = useCashierReport(currentBranchId);

  const isOwner = user?.role === UserRole.OWNER;
  const hasData = !!report && report.orderCount > 0;
  const scope = !isOwner
    ? 'Solo los pedidos que tomaste tú.'
    : currentBranchId ? `Ventas de la sucursal ${branchName(currentBranchId) ?? 'elegida'}.` : 'Ventas de todas las sucursales.';

  const handlePrint = () => {
    if (!report) return;
    printCashierReport(report, {
      cashierName:  user?.name ?? '',
      businessName: user?.tenantName ?? '',
      branchName:   branchName(user?.branchId ?? currentBranchId),
      periodLabel:  rangeLabel,
    });
  };

  return (
    <PageShell>
      <div className="max-w-4xl">
        <PageHeader
          title="Mi rendición"
          description={`${rangeLabel}. ${scope}`}
          actions={
            <Button variant="secondary" onClick={handlePrint} disabled={!hasData}>
              <Icon name="print" size={18} />
              Imprimir
            </Button>
          }
        >
          <SegmentedControl label="Período" value={period} onChange={setPeriod} options={PERIODS} />
        </PageHeader>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : !hasData ? (
          <EmptyState
            icon="chart"
            title="Sin ventas en este período"
            description="Cuando cobres pedidos, aquí verás cuánto efectivo entregar y el resto del desglose."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
            <ToHandIn report={report!} />
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Pedidos" value={String(report!.orderCount)} />
                <Stat label="Ticket promedio" value={money(report!.averageTicket)} />
              </div>
              <OrderTypes report={report!} />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
