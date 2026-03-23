import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { DailyReportDto } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { Card } from '../components/ui/Card';

function today() {
  return new Date().toISOString().split('T')[0];
}

export function ReportPage() {
  const [report, setReport] = useState<DailyReportDto | null>(null);
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .getDaily(date)
      .then(setReport)
      .catch(() => toast.error('Error al cargar reporte'))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {!report ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Sin datos para esta fecha</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <p className="text-sm text-gray-500">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">S/ {report.totalSales.toFixed(2)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{report.orderCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">S/ {report.averageTicket.toFixed(2)}</p>
            </Card>
            <Card>
              <p className="text-sm text-gray-500">Pedidos Delivery</p>
              <p className="text-2xl font-bold text-gray-900">{report.ordersByType.delivery}</p>
            </Card>
          </div>

          {/* Payment breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Métodos de Pago</h3>
              <div className="space-y-3">
                <PaymentBar label="Efectivo" amount={report.paymentBreakdown.cash} total={report.totalSales} color="bg-emerald-500" />
                <PaymentBar label="QR" amount={report.paymentBreakdown.qr} total={report.totalSales} color="bg-sky-500" />
                <PaymentBar label="Transferencia" amount={report.paymentBreakdown.transfer} total={report.totalSales} color="bg-violet-500" />
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Tipo de Pedido</h3>
              <div className="space-y-3">
                <TypeRow label="Local" count={report.ordersByType.dineIn} total={report.orderCount} />
                <TypeRow label="Para Llevar" count={report.ordersByType.takeout} total={report.orderCount} />
                <TypeRow label="Delivery" count={report.ordersByType.delivery} total={report.orderCount} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">S/ {amount.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TypeRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">{count}</span>
        <span className="text-xs text-gray-400">({pct}%)</span>
      </div>
    </div>
  );
}
