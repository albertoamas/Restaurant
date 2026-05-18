import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OrderStatus, UserRole } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { Spinner } from '../components/ui/Spinner';
import { useOrders } from '../hooks/useOrders';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { today } from '../utils/date';
import { toBoliviaDateString } from '../utils/timezone';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';
import { OrderCard } from '../components/orders/OrderCard';
import { PayOrderModal } from '../components/orders/PayOrderModal';
import { OrderSuccessModal } from '../components/pos/OrderSuccessModal';
import { EditOrderModal } from '../components/orders/EditOrderModal';
import { useAuth } from '../context/auth.context';

type ActiveTab = 'operation' | 'history';

const operationStatusFilters = [
  { value: '',                    label: 'Todos'      },
  { value: OrderStatus.PENDING,   label: 'Pendientes' },
  { value: OrderStatus.PREPARING, label: 'Preparando' },
  { value: OrderStatus.DELIVERED, label: 'Entregados' },
];

const historyStatusFilters = [
  { value: '',                    label: 'Todos'     },
  { value: OrderStatus.PENDING,   label: 'Pendiente' },
  { value: OrderStatus.PREPARING, label: 'Preparando'},
  { value: OrderStatus.DELIVERED, label: 'Entregado' },
  { value: OrderStatus.CANCELLED, label: 'Cancelado' },
];

function sevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return toBoliviaDateString(d);
}

export function OrdersPage() {
  const queryClient = useQueryClient();
  const { currentBranchId, user } = useAuth();
  const allowCortesia = user?.role === UserRole.OWNER;

  const [activeTab, setActiveTab] = useState<ActiveTab>('operation');

  // ── Shared modal state ────────────────────────────────────────────────────
  const [payingOrder,  setPayingOrder]  = useState<OrderDto | null>(null);
  const [paidOrder,    setPaidOrder]    = useState<OrderDto | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderDto | null>(null);

  // ── Operation tab state ───────────────────────────────────────────────────
  const [date,         setDate]         = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const { orders, setOrders, total, loading, loadingMore, hasMore, fetchOrders, loadMore } =
    useOrders(date, statusFilter, currentBranchId);

  // ── History tab state ─────────────────────────────────────────────────────
  const [historyFrom,    setHistoryFrom]    = useState(sevenDaysAgo);
  const [historyTo,      setHistoryTo]      = useState(today);
  const [historyStatus,  setHistoryStatus]  = useState('');
  const [searchInput,    setSearchInput]    = useState('');
  const [debouncedQ,     setDebouncedQ]     = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { orders: historyOrders, total: historyTotal, loading: historyLoading } = useOrderHistory({
    fromDate: historyFrom,
    toDate:   historyTo,
    q:        debouncedQ,
    status:   historyStatus,
    branchId: currentBranchId,
  });

  // ── Shared mutations ──────────────────────────────────────────────────────
  const invalidateHistory = () =>
    queryClient.invalidateQueries({ queryKey: ['orderHistory'] });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(newStatus === OrderStatus.CANCELLED ? 'Pedido cancelado' : 'Estado actualizado');
      fetchOrders();
      invalidateHistory();
    } catch (err) {
      handleApiError(err, 'Error al actualizar');
    }
  };

  const handlePaid = (order: OrderDto) => {
    setPayingOrder(null);
    setPaidOrder(order);
    fetchOrders();
    invalidateHistory();
  };

  const handleEditSaved = (updated: OrderDto) => {
    setEditingOrder(null);
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    invalidateHistory();
  };

  // ── Shared empty / no-branch UI ───────────────────────────────────────────
  const noBranchUi = (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <p className="text-sm font-semibold text-gray-500">Selecciona una sucursal</p>
      <p className="text-xs mt-1 text-gray-400">Elige una sucursal en el menú lateral para ver sus pedidos</p>
    </div>
  );

  const emptyUi = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm font-semibold text-gray-500">Sin pedidos</p>
      <p className="text-xs mt-1 text-gray-400">{message}</p>
    </div>
  );

  const tabClass = (tab: ActiveTab) =>
    `px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
      activeTab === tab
        ? 'bg-primary-600 text-white shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all duration-150 ${
      active
        ? 'bg-white text-gray-900 shadow-[0_1px_3px_oklch(0.13_0.012_260/0.10)]'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-slide">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.08)] p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-black text-xl text-gray-900">Gestión de Pedidos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monitorea estados en tiempo real o consulta el historial.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              {activeTab === 'operation'
                ? (total > orders.length ? `${orders.length} de ${total}` : total)
                : (historyTotal > historyOrders.length ? `${historyOrders.length} de ${historyTotal}` : historyTotal)
              } pedidos
            </span>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1.5 mb-4">
          <button className={tabClass('operation')} onClick={() => setActiveTab('operation')}>
            Operación
          </button>
          <button className={tabClass('history')} onClick={() => setActiveTab('history')}>
            Historial
          </button>
        </div>

        {/* Operation filters */}
        {activeTab === 'operation' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)] transition-[border-color,box-shadow]"
            />
            <div className="flex gap-0.5 bg-[oklch(0.96_0.008_252)] rounded-xl p-1 overflow-x-auto">
              {operationStatusFilters.map((f) => (
                <button key={f.value} onClick={() => setStatusFilter(f.value)} className={pillClass(statusFilter === f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History filters */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-3">
            {/* Search bar */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por #pedido o nombre de cliente..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white
                  focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                  shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)] transition-[border-color,box-shadow]"
              />
            </div>

            {/* Date range + status pills */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="date"
                  value={historyFrom}
                  max={historyTo}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
                    focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                    shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)] transition-[border-color,box-shadow]"
                />
                <span className="text-gray-400 text-sm shrink-0">→</span>
                <input
                  type="date"
                  value={historyTo}
                  min={historyFrom}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
                    focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                    shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)] transition-[border-color,box-shadow]"
                />
              </div>
              <div className="flex gap-0.5 bg-[oklch(0.96_0.008_252)] rounded-xl p-1 overflow-x-auto">
                {historyStatusFilters.map((f) => (
                  <button key={f.value} onClick={() => setHistoryStatus(f.value)} className={pillClass(historyStatus === f.value)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab: Operación ───────────────────────────────────────────────────── */}
      {activeTab === 'operation' && (
        <>
          {!currentBranchId ? noBranchUi
            : loading ? <div className="flex justify-center py-12"><Spinner /></div>
            : orders.length === 0 ? emptyUi('Cambia la fecha o filtros')
            : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onPayOrder={setPayingOrder}
                    onEdit={setEditingOrder}
                  />
                ))}
                {hasMore && (
                  <div className="flex justify-center pt-2 pb-4">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_3px_oklch(0.13_0.012_260/0.07)]"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                          </svg>
                          Cargando...
                        </>
                      ) : (
                        <>
                          Cargar más
                          <span className="text-xs font-normal text-gray-400">({total - orders.length} restantes)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          }
        </>
      )}

      {/* ── Tab: Historial ───────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <>
          {!currentBranchId ? noBranchUi
            : historyLoading ? <div className="flex justify-center py-12"><Spinner /></div>
            : historyOrders.length === 0 ? emptyUi(
                debouncedQ
                  ? `Sin resultados para "${debouncedQ}"`
                  : 'Ajusta el rango de fechas o filtros'
              )
            : (
              <div className="space-y-3">
                {historyOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onPayOrder={setPayingOrder}
                    onEdit={setEditingOrder}
                  />
                ))}
                {historyTotal > historyOrders.length && (
                  <p className="text-center text-xs text-gray-400 py-3">
                    Mostrando {historyOrders.length} de {historyTotal} — refina la búsqueda para ver más
                  </p>
                )}
              </div>
            )
          }
        </>
      )}

      {/* ── Shared modals ────────────────────────────────────────────────────── */}
      {payingOrder && (
        <PayOrderModal
          isOpen
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={handlePaid}
          allowCortesia={allowCortesia}
        />
      )}

      {paidOrder && (
        <OrderSuccessModal
          isOpen
          order={paidOrder}
          title="¡Cobro registrado!"
          onClose={() => setPaidOrder(null)}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          isOpen
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
