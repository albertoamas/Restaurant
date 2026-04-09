import type { OrderDto } from '@pos/shared';
import { OrderType } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { printReceipt } from '../../utils/print';
import { useSettingsStore } from '../../store/settings.store';
import { useAuth } from '../../context/auth.context';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'Local',
  [OrderType.TAKEOUT]: 'Para Llevar',
  [OrderType.DELIVERY]: 'Delivery',
};

const confettiPieces = [
  { color: 'bg-primary-500', x: '-20px', delay: '0ms',   size: 'w-2 h-2' },
  { color: 'bg-emerald-500', x: '20px',  delay: '60ms',  size: 'w-1.5 h-1.5' },
  { color: 'bg-amber-400',   x: '-35px', delay: '30ms',  size: 'w-2 h-1' },
  { color: 'bg-rose-400',    x: '35px',  delay: '90ms',  size: 'w-1.5 h-2' },
  { color: 'bg-violet-500',  x: '-12px', delay: '45ms',  size: 'w-2 h-1.5' },
  { color: 'bg-cyan-400',    x: '12px',  delay: '75ms',  size: 'w-1 h-2' },
];

export function OrderSuccessModal({ isOpen, onClose, order }: Props) {
  const { user } = useAuth();
  const { businessAddress, businessPhone, receiptFooter, tenantLogo } = useSettingsStore();

  const handlePrintReceipt = () => printReceipt(order, {
    businessName: user?.tenantName ?? 'Mi Negocio',
    businessAddress,
    businessPhone,
    receiptFooter,
    logoUrl: tenantLogo,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-2">
        {/* Success icon with confetti */}
        <div className="relative inline-flex items-center justify-center mb-5">
          {/* Confetti pieces */}
          {confettiPieces.map((p, i) => (
            <span
              key={i}
              className={`absolute ${p.color} ${p.size} rounded-sm`}
              style={{
                left: `calc(50% + ${p.x})`,
                bottom: '100%',
                animation: `confetti-fall 0.7s ease-out ${p.delay} both`,
              }}
            />
          ))}

          {/* Pulse ring */}
          <span className="absolute w-20 h-20 rounded-full bg-emerald-100 animate-ping opacity-60" />

          {/* Icon circle */}
          <div className="relative w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center ring-4 ring-emerald-200/60">
            <svg className="w-9 h-9 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
                className="animate-success-check"
              />
            </svg>
          </div>
        </div>

        <p className="font-heading font-black text-2xl text-gray-900 mb-0.5">
          ¡Pedido Creado!
        </p>
        <p className="font-heading font-bold text-lg text-gray-500 mb-1">
          #{order.orderNumber}
        </p>
        <p className="text-sm text-gray-400 mb-2">{ORDER_TYPE_LABEL[order.type]}</p>

        <p className="font-heading font-black text-4xl text-emerald-600 mb-5">
          Bs {Number(order.total).toFixed(2)}
        </p>

        <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          Comanda enviada a cocina
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth={!order.isPaid} onClick={onClose}>
            Nuevo pedido
          </Button>
          {order.isPaid && (
            <Button
              variant="ghost"
              fullWidth
              onClick={handlePrintReceipt}
              className="border border-gray-200"
            >
              Imprimir recibo
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
