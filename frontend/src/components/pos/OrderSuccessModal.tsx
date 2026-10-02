import type { OrderDto } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { printReceipt } from '../../utils/print';
import { orderTypeLabels } from '../../utils/order';
import { useReceiptSettings } from '../../hooks/useReceiptSettings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
  title?: string;
}

/** Confirmación tras cobrar (o registrar un pago). La acción principal es seguir vendiendo. */
export function OrderSuccessModal({ isOpen, onClose, order, title = 'Pedido creado' }: Props) {
  const receiptSettings = useReceiptSettings();
  const handlePrintReceipt = () => printReceipt(order, receiptSettings);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {order.isPaid && (
            <Button variant="secondary" fullWidth onClick={handlePrintReceipt}>
              <Icon name="print" size={18} />
              Imprimir recibo
            </Button>
          )}
          <Button fullWidth onClick={onClose}>Nuevo pedido</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-14 h-14 rounded-full bg-green-600/12 border border-green-600/30 flex items-center justify-center mb-4">
          {/* El trazo se dibuja solo: stroke-dasharray/dashoffset se heredan al path del ícono. */}
          <Icon name="check" size={32} strokeWidth={2.5} className="text-green-700 dark:text-green-400 animate-success-check" />
        </div>

        <p className="text-label text-soft">
          Pedido <span className="font-semibold text-main">#{order.orderNumber}</span>, {orderTypeLabels[order.type]}
        </p>
        <p className="text-display font-bold text-main font-heading mt-1">
          Bs {Number(order.total).toFixed(2)}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-label text-soft">
          <Icon name="flame" size={15} className="text-muted" />
          Comanda enviada a cocina
        </p>
      </div>
    </Modal>
  );
}
