import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OrderStatus, UserRole } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { PageShell } from '../components/ui/PageShell';
import { useOrders } from '../hooks/useOrders';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { today } from '../utils/date';
import { toBoliviaDateString } from '../utils/timezone';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderHistoryTable } from '../components/orders/OrderHistoryTable';
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
    // Optimistic update — apply immediately and respect current filter
    setOrders((prev) =>
      prev
        .map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
        .filter((o) => !statusFilter || o.status === statusFilter),
    );
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(newStatus === OrderStatus.CANCELLED ? 'Pedido cancelado' : 'Estado actualizado');
      invalidateHistory();
    } catch (err) {
      handleApiError(err, 'Error al actualizar');
      fetchOrders(); // Revert on error
    }
  };

  const handlePaid = (order: OrderDto) => {
    setPayingOrder(null);
    setPaidOrder(order);
    setOrders((prev) =>
      prev
        .map((o) => o.id === order.id ? order : o)
        .filter((o) => !statusFilter || o.status === statusFilter),
    );
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
      <Icon name="building" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
      <p className="text-sm font-semibold text-gray-500">Selecciona una sucursal</p>
      <p className="text-xs mt-1 text-gray-400">Elige una sucursal en el menú lateral para ver sus pedidos</p>
    </div>
  );

  const emptyUi = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Icon name="orders" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
      <p className="text-sm font-semibold text-gray-500">Sin pedidos</p>
      <p className="text-xs mt-1 text-gray-400">{message}</p>
    </div>
  );

  const tabClass = (tab: ActiveTab) =>
    `px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 ${
      activeTab === tab
        ? 'bg-primary-600 text-white shadow-[0_2px_6px_oklch(0.60_0.22_42/0.30)]'
        : 'text-gray-500 hover:text-gray-700 hover:bg-white/8'
    }`;

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all duration-150 ${
      active
        ? 'bg-primary-600 text-white'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <PageShell>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/8 shadow-[0_8px_24px_oklch(0.06_0.010_38/0.6)] p-4 mb-6" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-black text-xl text-gray-900">Gestión de Pedidos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monitorea estados en tiempo real o consulta el historial.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100/60 border border-primary-500/25 text-primary-400">
              {activeTab === 'operation'
                ? (total > orders.length ? `${orders.length} de ${total}` : total)
                : (historyTotal > historyOrders.length ? `${historyOrders.length} de ${historyTotal}` : historyTotal)
              } pedidos
            </span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              <button className={tabClass('operation')} onClick={() => setActiveTab('operation')}>
                Operación
              </button>
              <button className={tabClass('history')} onClick={() => setActiveTab('history')}>
                Historial
              </button>
            </div>
          </div>
        </div>

        {/* Operation filters */}
        {activeTab === 'operation' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark]
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50
                transition-[border-color,box-shadow]"
            />
            <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
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
            {/* Date range + status pills */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="date"
                  value={historyFrom}
                  max={historyTo}
                  onChange={(e) => setHistoryFrom(e.target.value)}
                  className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark]
                    focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50
                    transition-[border-color,box-shadow]"
                />
                <span className="text-gray-400 text-sm shrink-0">→</span>
                <input
                  type="date"
                  value={historyTo}
                  min={historyFrom}
                  onChange={(e) => setHistoryTo(e.target.value)}
                  className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark]
                    focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50
                    transition-[border-color,box-shadow]"
                />
              </div>
              <div className="flex gap-0.5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                {historyStatusFilters.map((f) => (
                  <button key={f.value} onClick={() => setHistoryStatus(f.value)} className={pillClass(historyStatus === f.value)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por #pedido o nombre de cliente..."
                className="w-full pl-9 pr-4 py-2 border border-white/10 rounded-xl text-sm bg-white/5 text-gray-700 placeholder:text-gray-400
                  focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50
                  transition-[border-color,box-shadow]"
              />
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
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-gray-600 hover:border-primary-500/40 hover:text-primary-400 hover:bg-primary-500/8 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <Spinner size="sm" color="muted" />
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
              <OrderHistoryTable
                orders={historyOrders}
                total={historyTotal}
                onPayOrder={setPayingOrder}
                onEdit={setEditingOrder}
              />
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
    </PageShell>
  );
}
