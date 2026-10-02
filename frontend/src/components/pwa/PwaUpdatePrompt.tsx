import { usePwaUpdate } from '../../hooks/usePwaUpdate';
import { useCartStore } from '../../store/cart.store';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

/**
 * Aviso de versión nueva. Nunca recarga solo: actualizar recarga la página, y el carrito
 * vive solo en memoria (`cart.store` no persiste), así que con productos cargados el botón
 * queda bloqueado hasta que el pedido se cobre o se vacíe.
 */
export function PwaUpdatePrompt() {
  const { needRefresh, update, dismiss } = usePwaUpdate();
  const cartCount = useCartStore((s) => s.items.length);

  if (!needRefresh) return null;

  const blockedByCart = cartCount > 0;

  return (
    <div
      data-print-hide
      role="status"
      aria-live="polite"
      className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:w-96 rounded-card border border-line bg-surface-card shadow-floating p-4 animate-slide"
    >
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-500/10 text-primary-700 dark:text-primary-400">
          <Icon name="refresh" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-main">
            Hay una versión nueva de YankoPOS
          </p>
          <p className="mt-0.5 text-label text-soft">
            {blockedByCart
              ? 'Termina o vacía el pedido en curso para actualizar: al recargar se perdería el carrito.'
              : 'Actualizar recarga la página en un segundo.'}
          </p>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={dismiss}>
              Más tarde
            </Button>
            <Button size="sm" onClick={update} disabled={blockedByCart}>
              Actualizar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
