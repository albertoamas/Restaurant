import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { useKitchenOrders } from '../hooks/useKitchenOrders';
import { useKitchenSound } from '../hooks/useKitchenSound';
import { useFullscreen } from '../hooks/useFullscreen';
import { useBranchNames } from '../hooks/useBranches';
import { useNow } from '../hooks/useNow';
import { formatBoliviaTime } from '../utils/date';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { KitchenCard } from '../components/kitchen/KitchenCard';
import { PickBranch } from '../components/branch/PickBranch';
import { ORDER_STATUS_UI } from '../components/orders/order-status';

/** Los tiempos se muestran en minutos: basta con recalcular cada 15 s. */
const TICK_MS = 15_000;

type Column = 'pending' | 'preparing';

/** Botón de ícono de la barra (44 px, táctil). */
function BarButton({ icon, label, onClick, pressed, className = '' }: { icon: IconName; label: string; onClick: () => void; pressed?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`${className} w-11 h-11 shrink-0 flex items-center justify-center rounded-control border border-line bg-surface-card text-soft hover:text-main hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60`}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

interface ColumnProps {
  status: OrderStatus;
  title: string;
  orders: OrderDto[];
  loading: boolean;
  now: number;
  empty: { icon: IconName; title: string; description: string };
  onAction: (id: string, status: OrderStatus) => void;
  /** Solo en celular: la columna que no está elegida se oculta. */
  hiddenOnPhone: boolean;
}

function KitchenColumn({ status, title, orders, loading, now, empty, onAction, hiddenOnPhone }: ColumnProps) {
  const ui = ORDER_STATUS_UI[status];
  return (
    <section
      aria-label={title}
      className={`flex flex-col min-h-0 ${hiddenOnPhone ? 'max-md:hidden' : ''}`}
    >
      <h2 className="max-md:sr-only flex items-center gap-2 pb-3 text-heading font-semibold text-main">
        <span className={`w-2.5 h-2.5 rounded-full ${ui.dot}`} />
        {title}
        <span className="text-heading text-muted tabular-nums">{orders.length}</span>
      </h2>
      <div className="md:flex-1 md:min-h-0 md:overflow-y-auto md:pr-1">
        {loading ? (
          <div className="grid gap-4"><Skeleton variant="card" /><Skeleton variant="card" /></div>
        ) : orders.length === 0 ? (
          <div className="rounded-card border border-dashed border-line-strong">
            <EmptyState compact icon={empty.icon} title={empty.title} description={empty.description} />
          </div>
        ) : (
          // En monitores anchos, dos comandas por fila dentro de cada columna.
          <div className="grid gap-4 2xl:grid-cols-2 items-start">
            {orders.map((order, i) => (
              <KitchenCard
                key={order.id}
                order={order}
                now={now}
                isNext={status === OrderStatus.PENDING && i === 0}
                onAction={onAction}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function KitchenPage() {
  const navigate = useNavigate();
  const { currentBranchId } = useAuth();
  const { branchName } = useBranchNames();
  const sound = useKitchenSound();
  const fullscreen = useFullscreen();
  const { pending, preparing, loading, updateStatus, refresh } = useKitchenOrders(currentBranchId, sound.play);
  const now = useNow(TICK_MS);
  const [column, setColumn] = useState<Column>('pending');

  const branchLabel = branchName(currentBranchId);

  return (
    <div className="min-h-dvh md:h-dvh flex flex-col bg-surface-page">
      <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-line bg-surface-card">
        <span className="w-10 h-10 shrink-0 rounded-control bg-amber-500/14 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
          <Icon name="flame" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-heading font-bold text-main font-heading leading-tight">Cocina</h1>
          {branchLabel && <p className="text-caption text-soft truncate">Sucursal {branchLabel}</p>}
        </div>
        <span className="hidden sm:block text-heading font-semibold text-main tabular-nums">{formatBoliviaTime(new Date(now).toISOString())}</span>
        <div className="flex items-center gap-2">
          <BarButton
            icon={sound.enabled ? 'volume' : 'volume-off'}
            label={sound.enabled ? 'Silenciar aviso de pedidos nuevos' : 'Activar aviso de pedidos nuevos'}
            pressed={sound.enabled}
            onClick={sound.toggle}
          />
          {fullscreen.supported && (
            <BarButton
              icon={fullscreen.active ? 'minimize' : 'maximize'}
              label={fullscreen.active ? 'Salir de pantalla completa' : 'Pantalla completa'}
              onClick={fullscreen.toggle}
              // En celular casi no se usa y quita espacio al nombre de la sucursal.
              className="max-sm:hidden"
            />
          )}
          <BarButton icon="refresh" label="Actualizar pedidos" onClick={() => { void refresh(); }} />
          <Button variant="secondary" onClick={() => navigate('/pos')} aria-label="Volver al panel">
            <Icon name="arrow-left" size={18} />
            <span className="hidden sm:inline">Volver al panel</span>
          </Button>
        </div>
      </header>

      {!currentBranchId ? (
        <main className="flex-1">
          <PickBranch description="La cocina muestra los pedidos de una sucursal." />
        </main>
      ) : (
        <main className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-4">
          {sound.enabled && sound.blocked && (
            <p className="mb-3 flex items-center gap-2 rounded-control border border-line bg-surface-2 px-3 py-2 text-label text-soft">
              <Icon name="volume" size={16} className="shrink-0" />
              Toca la pantalla una vez para activar el aviso de pedidos nuevos.
            </p>
          )}

          <div className="md:hidden mb-4">
            <SegmentedControl
              label="Columna de cocina"
              fullWidth
              value={column}
              onChange={setColumn}
              options={[
                { value: 'pending',   label: 'Pendientes', count: pending.length },
                { value: 'preparing', label: 'Preparando', count: preparing.length },
              ]}
            />
          </div>

          <div className="flex-1 min-h-0 grid md:grid-cols-2 gap-6">
            <KitchenColumn
              status={OrderStatus.PENDING}
              title="Pendientes"
              orders={pending}
              loading={loading}
              now={now}
              empty={{ icon: 'orders', title: 'Sin pedidos pendientes', description: 'Los pedidos nuevos aparecen aquí al instante.' }}
              onAction={updateStatus}
              hiddenOnPhone={column !== 'pending'}
            />
            <KitchenColumn
              status={OrderStatus.PREPARING}
              title="Preparando"
              orders={preparing}
              loading={loading}
              now={now}
              empty={{ icon: 'flame', title: 'Nada en preparación', description: 'Toca "Iniciar preparación" en un pedido pendiente.' }}
              onAction={updateStatus}
              hiddenOnPhone={column !== 'preparing'}
            />
          </div>
        </main>
      )}
    </div>
  );
}
