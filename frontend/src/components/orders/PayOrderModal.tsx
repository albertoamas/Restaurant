import { useState } from 'react';
import type { OrderDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PaymentMethodSection } from '../pos/PaymentMethodSection';
import { usePaymentSelection } from '../pos/usePaymentSelection';
import { orderTypeLabels } from '../../utils/order';
import { ordersApi } from '../../api/orders.api';
import { handleApiError } from '../../utils/api-error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
  onPaid: (order: OrderDto) => void;
  allowCortesia?: boolean;
}

/** Cobro de un pedido que quedó pendiente. Usa las mismas piezas de pago que el POS. */
export function PayOrderModal({ isOpen, onClose, order, onPaid, allowCortesia = false }: Props) {
  const total = Number(order.total);
  const payment = usePaymentSelection(total);
  const [loading, setLoading] = useState(false);

  const canConfirm = payment.done && !loading;
  const missing = payment.done ? null : payment.splitMode ? 'Completa el pago dividido' : 'Elige el método de pago';
  const units = order.items.reduce((n, i) => n + i.quantity, 0);

  const handleClose = () => { payment.reset(); onClose(); };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const updated = await ordersApi.registerPayments(
        order.id,
        payment.payments().map((p) => ({ method: p.method, amount: p.amount })),
      );
      payment.reset();
      onPaid(updated);
    } catch (err) {
      handleApiError(err, 'Error al registrar cobro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Cobrar pedido #${order.orderNumber}`}
      size="md"
      footer={
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-label font-semibold text-soft">Total</span>
            <span className="text-display font-bold text-main font-heading">Bs {total.toFixed(2)}</span>
          </div>
          <Button variant="success" size="xl" fullWidth onClick={handleConfirm} disabled={!canConfirm} loading={loading}>
            {loading ? 'Procesando' : missing ?? 'Confirmar cobro'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Detalle como en el recibo: qué se cobra, línea por línea. */}
        <section className="rounded-card bg-surface-2 border border-line px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-body font-semibold text-main truncate">
              {orderTypeLabels[order.type]}
              {order.customer?.name && <span className="font-normal text-soft">, {order.customer.name}</span>}
            </p>
            <span className="text-label text-soft shrink-0">{units} {units === 1 ? 'unidad' : 'unidades'}</span>
          </div>
          <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-3 py-1.5 text-label">
                <span className="text-main min-w-0">
                  <span className="font-semibold">{i.quantity}</span> {i.productName}
                </span>
                <span className="text-soft tabular-nums shrink-0">Bs {Number(i.subtotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {order.notes && <p className="text-label text-soft mt-1.5">Nota: {order.notes}</p>}
        </section>

        <section>
          <h3 className="text-body font-semibold text-main mb-3">Método de pago</h3>
          <PaymentMethodSection selection={payment} allowCortesia={allowCortesia} />
        </section>
      </div>
    </Modal>
  );
}
