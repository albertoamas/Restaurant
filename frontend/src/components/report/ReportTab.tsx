import type { CategoryDto, DailyReportDto, ExpenseSummaryDto, TopCustomerDto, TopProductDto } from '@pos/shared';
import { ExpenseCategory } from '@pos/shared';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { StatCard, PaymentBar, TypeRow, TopProductRow, TopCustomerRow } from './index';

const EXPENSE_LABELS: Partial<Record<ExpenseCategory, string>> = {
  [ExpenseCategory.SUPPLIES]:    'Insumos',
  [ExpenseCategory.WAGES]:       'Personal',
  [ExpenseCategory.UTILITIES]:   'Servicios',
  [ExpenseCategory.TRANSPORT]:   'Transporte',
  [ExpenseCategory.MAINTENANCE]: 'Mantenimiento',
  [ExpenseCategory.OTHER]:       'Otro',
};

interface Props {
  report:          DailyReportDto | null;
  expenseSummary:  ExpenseSummaryDto | null;
  topProducts:     TopProductDto[];
  topCustomers:    TopCustomerDto[];
  categories:      CategoryDto[];
  loading:         boolean;
  topLoading:      boolean;
  custLoading:     boolean;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
}

export function ReportTab({
  report,
  expenseSummary,
  topProducts,
  topCustomers,
  categories,
  loading,
  topLoading,
  custLoading,
  selectedCategory,
  onCategoryChange,
}: Props) {
  const hasData =
    report &&
    (report.orderCount > 0 ||
      report.paymentBreakdown.cortesia > 0 ||
      (expenseSummary?.total ?? 0) > 0);

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Icon name="chart" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
        <p className="text-sm font-semibold text-gray-500">Sin ventas en este período</p>
        <p className="text-xs mt-1">Selecciona otro rango de fechas</p>
      </div>
    );
  }

  const netProfit  = report!.totalSales - (expenseSummary?.total ?? 0);
  const isPositive = netProfit >= 0;
  const marginPct  = report!.totalSales > 0 ? (netProfit / report!.totalSales) * 100 : 0;
  const profitPct  = report!.totalSales > 0 ? Math.min(100, Math.max(0, (netProfit / report!.totalSales) * 100)) : 0;
  const expensePct = report!.totalSales > 0 ? Math.min(100, ((expenseSummary?.total ?? 0) / report!.totalSales) * 100) : 0;

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Ventas Totales"
          value={`Bs ${report!.totalSales.toFixed(2)}`}
          icon={<Icon name="dollar" size={24} />}
          accent="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          label="Ticket Promedio"
          value={`Bs ${report!.averageTicket.toFixed(2)}`}
          icon={<Icon name="receipt" size={24} />}
          accent="text-violet-400"
          bg="bg-violet-500/10"
        />
        <StatCard
          label="Gastos Totales"
          value={expenseSummary ? `Bs ${expenseSummary.total.toFixed(2)}` : 'Bs 0.00'}
          icon={<Icon name="minus" size={24} />}
          accent="text-red-400"
          bg="bg-red-500/10"
        />
        <StatCard
          label="Ganancia Neta"
          value={`${!isPositive ? '−' : ''}Bs ${Math.abs(netProfit).toFixed(2)}`}
          icon={<Icon name={isPositive ? 'trending-up' : 'trending-down'} size={24} />}
          accent={isPositive ? 'text-emerald-400' : 'text-red-400'}
          bg={isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}
          valueClassName={isPositive ? 'text-emerald-600' : 'text-red-600'}
          sub={
            expenseSummary !== null ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-700 border-red-500/20'
              }`}>
                {isPositive ? '↑' : '↓'} {Math.abs(marginPct).toFixed(1)}% margen
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium">Sin gastos registrados</span>
            )
          }
        />
      </div>

      {/* Payment & Type breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Métodos de Pago</h3>
          <div className="space-y-4">
            <PaymentBar label="Efectivo"      amount={report!.paymentBreakdown.cash}     total={report!.totalSales} color="bg-emerald-500" />
            <PaymentBar label="QR"            amount={report!.paymentBreakdown.qr}       total={report!.totalSales} color="bg-primary-500" />
            <PaymentBar label="Transferencia" amount={report!.paymentBreakdown.transfer} total={report!.totalSales} color="bg-violet-500"  />
            {report!.paymentBreakdown.cortesia > 0 && (
              <PaymentBar label="Cortesía" amount={report!.paymentBreakdown.cortesia} total={report!.totalSales + report!.paymentBreakdown.cortesia} color="bg-amber-400" />
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
            <TypeRow label="Local"       count={report!.ordersByType.dineIn}   total={report!.orderCount} color="bg-primary-500" />
            <TypeRow label="Para Llevar" count={report!.ordersByType.takeout}  total={report!.orderCount} color="bg-amber-500"   />
            <TypeRow label="Delivery"    count={report!.ordersByType.delivery} total={report!.orderCount} color="bg-violet-500"  />
          </div>
        </Card>
      </div>

      {/* Top products */}
      <Card variant="default">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-gray-700 font-heading">Productos Más Vendidos</h3>
          {categories.length > 0 && (
            <select
              data-print-hide
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="text-xs border border-white/10 rounded-xl px-3 py-1.5 bg-[var(--color-surface-card)] text-gray-600 [color-scheme:dark] focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow] cursor-pointer"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        {topLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Icon name="package" size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs font-medium text-gray-500">Sin datos para este período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p, i) => <TopProductRow key={p.productId} rank={i + 1} product={p} maxQty={topProducts[0].totalQuantity} />)}
          </div>
        )}
      </Card>

      {/* Top customers */}
      <Card variant="default" className="mt-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Clientes Más Frecuentes</h3>
        {custLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : topCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Icon name="users" size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs font-medium text-gray-500">Sin clientes registrados en este período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topCustomers.map((c, i) => <TopCustomerRow key={c.customerId} rank={i + 1} customer={c} maxSpent={topCustomers[0].totalSpent} />)}
          </div>
        )}
      </Card>

      {/* Expense breakdown */}
      {expenseSummary !== null && expenseSummary.total > 0 && (
        <Card variant="panel" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 font-heading">Gastos por Categoría</h3>
            <span className="font-heading font-bold text-sm text-red-500">Bs {expenseSummary.total.toFixed(2)}</span>
          </div>
          <div className="space-y-3">
            {(Object.entries(expenseSummary.byCategory) as [string, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 font-medium">{EXPENSE_LABELS[cat as ExpenseCategory] ?? cat}</span>
                    <span className="font-heading font-bold text-gray-900">Bs {amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-red-400 transition-[width] duration-700" style={{ width: `${(amount / expenseSummary.total) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Net profit */}
      {expenseSummary !== null && (
        <Card variant="panel" className="mt-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ganancia Neta</p>
              <p className={`font-heading font-black text-3xl leading-none ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {!isPositive && <span className="text-xl mr-0.5">−</span>}Bs {Math.abs(netProfit).toFixed(2)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${isPositive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(marginPct).toFixed(1)}% margen
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-5">
            <div className="h-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${profitPct}%` }} />
            <div className="h-full bg-red-400 transition-[width] duration-700"   style={{ width: `${expensePct}%` }} />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Ingresos</span>
              <span className="font-heading font-bold text-gray-900">Bs {report!.totalSales.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Gastos operativos</span>
              <span className="font-heading font-bold text-red-500">− Bs {expenseSummary.total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2.5 border-t border-gray-100">
              <span className="font-semibold text-gray-700">Resultado neto</span>
              <span className={`font-heading font-black ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {!isPositive && '− '}Bs {Math.abs(netProfit).toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
