import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { OrderStatus, UserRole } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { PageShell } from '../components/ui/PageShell';
import { useOrders } from '../hooks/useOrders';
import { useOrderHistory } from '../hooks/useOrderHistory';
import { useOrderCounts } from '../hooks/useOrderCounts';
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
import { AddItemsToOrderModal } from '../components/orders/AddItemsToOrderModal';

type ActiveTab = 'operation' | 'history';

/** 'all' en el control; '' hacia los hooks (sin filtro de estado). */
const ALL = 'all';
const toFilter = (v: string) => (v === ALL ? '' : v);

const historyStatusFilters = [
  { value: ALL,                   label: 'Todos'      },
  { value: OrderStatus.PENDING,   label: 'Pendientes' },
  { value: OrderStatus.PREPARING, label: 'Preparando' },
  { value: OrderStatus.DELIVERED, label: 'Entregados' },
  { value: OrderStatus.CANCELLED, label: 'Cancelados' },
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
  const [payingOrder,       setPayingOrder]       = useState<OrderDto | null>(null);
  const [paidOrder,         setPaidOrder]         = useState<OrderDto | null>(null);
  const [editingOrder,      setEditingOrder]      = useState<OrderDto | null>(null);
  const [addingItemsOrder,  setAddingItemsOrder]  = useState<OrderDto | null>(null);

  // ── Operation tab state ───────────────────────────────────────────────────
  const [date,         setDate]         = useState(today());
  const [statusChoice, setStatusChoice] = useState<string>(ALL);
  const statusFilter = toFilter(statusChoice);
  const { orders, setOrders, total, loading, loadingMore, hasMore, fetchOrders, loadMore } =
    useOrders(date, statusFilter, currentBranchId);
  const { counts, refreshCounts } = useOrderCounts({
    date, branchId: currentBranchId, loaded: orders, loadedIsWholeDay: statusFilter === '' && !hasMore,
  });
  const navigate = useNavigate();

  // ── History tab state ─────────────────────────────────────────────────────
  const [historyFrom,    setHistoryFrom]    = useState(sevenDaysAgo);
  const [historyTo,      setHistoryTo]      = useState(today);
  const [historyChoice,  setHistoryChoice]  = useState<string>(ALL);
  const historyStatus = toFilter(historyChoice);
  const [searchInput,    setSearchInput]    = useState('');
  const [debouncedQ,     setDebouncedQ]     = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const {
    orders: historyOrders, total: historyTotal, loading: historyLoading,
    loadingMore: historyLoadingMore, hasMore: historyHasMore, loadMore: historyLoadMore,
  } = useOrderHistory({
    fromDate: historyFrom,
    toDate:   historyTo,
    q:        debouncedQ,
    status:   historyStatus,
    branchId: currentBranchId,
  });

  // ── Shared mutations ──────────────────────────────────────────────────────
  const invalidateHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
    refreshCounts();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
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
      fetchOrders();
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

  const handleItemsAdded = (updated: OrderDto) => {
    setAddingItemsOrder(null);
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    invalidateHistory();
  };

  const operationFilters = [
    { value: ALL,                   label: 'Todos',      count: counts?.all },
    { value: OrderStatus.PENDING,   label: 'Pendientes', count: counts?.pending },
    { value: OrderStatus.PREPARING, label: 'Preparando', count: counts?.preparing },
    { value: OrderStatus.DELIVERED, label: 'Entregados', count: counts?.delivered },
  ];

  const isToday = date === today();

  const loadingList = (
    <div className="grid gap-3 xl:grid-cols-2" aria-busy="true">
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  const loadMoreButton = (onClick: () => void, busy: boolean, remaining: number) => (
    <div className="flex justify-center pt-4">
      <Button variant="secondary" onClick={onClick} loading={busy}>
        {busy ? 'Cargando' : `Cargar más (${remaining} restantes)`}
      </Button>
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        title="Pedidos"
        actions={
          <SegmentedControl
            label="Vista de pedidos"
            value={activeTab}
            onChange={setActiveTab}
            options={[{ value: 'operation', label: 'Operación' }, { value: 'history', label: 'Historial' }]}
          />
        }
      >
        {activeTab === 'operation' ? (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="sm:w-48">
              <Input type="date" label="Fecha" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <SegmentedControl
              label="Estado del pedido"
              value={statusChoice}
              onChange={setStatusChoice}
              options={operationFilters}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-end gap-3">
              <div className="grid grid-cols-2 gap-3 lg:w-96">
                <Input type="date" label="Desde" value={historyFrom} max={historyTo} onChange={(e) => setHistoryFrom(e.target.value)} />
                <Input type="date" label="Hasta" value={historyTo} min={historyFrom} onChange={(e) => setHistoryTo(e.target.value)} />
              </div>
              <SegmentedControl
                label="Estado del pedido"
                value={historyChoice}
                onChange={setHistoryChoice}
                options={historyStatusFilters}
              />
            </div>
            <Input
              aria-label="Buscar pedido"
              placeholder="Número de pedido o nombre del cliente"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftAddon={<Icon name="search" size={18} />}
            />
          </div>
        )}
      </PageHeader>

      {activeTab === 'operation' && (
        loading ? loadingList
          : orders.length === 0 ? (
            <EmptyState
              icon="orders"
              title="Sin pedidos"
              description={statusFilter ? 'No hay pedidos con este estado en la fecha elegida.' : isToday ? 'Los pedidos cobrados en el punto de venta aparecen aquí al instante.' : 'No hubo pedidos en la fecha elegida.'}
              action={isToday && !statusFilter ? <Button onClick={() => navigate('/pos')}>Ir al punto de venta</Button> : undefined}
            />
          ) : (
            <>
              <div className="grid gap-3 xl:grid-cols-2">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onPayOrder={setPayingOrder}
                    onEdit={setEditingOrder}
                    onAddItems={setAddingItemsOrder}
                  />
                ))}
              </div>
              {hasMore && loadMoreButton(loadMore, loadingMore, total - orders.length)}
            </>
          )
      )}

      {activeTab === 'history' && (
        historyLoading ? loadingList
          : historyOrders.length === 0 ? (
            <EmptyState
              icon="search"
              title="Sin resultados"
              description={debouncedQ ? `No hay pedidos que coincidan con "${debouncedQ}".` : 'Prueba con otro rango de fechas o de estado.'}
            />
          ) : (
            <>
              <p className="mb-3 text-label text-soft">
                {historyTotal === 1 ? '1 pedido' : `${historyTotal} pedidos`}
                {historyTotal > historyOrders.length ? `, mostrando ${historyOrders.length}` : ''}
              </p>
              <OrderHistoryTable
                orders={historyOrders}
                onPayOrder={setPayingOrder}
                onEdit={setEditingOrder}
                onStatusChange={handleStatusChange}
              />
              {historyHasMore && loadMoreButton(historyLoadMore, historyLoadingMore, historyTotal - historyOrders.length)}
            </>
          )
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
          title="Cobro registrado"
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

      {addingItemsOrder && (
        <AddItemsToOrderModal
          isOpen
          order={addingItemsOrder}
          onClose={() => setAddingItemsOrder(null)}
          onUpdated={handleItemsAdded}
        />
      )}
    </PageShell>
  );
}
