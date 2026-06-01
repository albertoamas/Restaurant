import { useState, useEffect } from 'react';
import { OrderType, PaymentMethod } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { CustomerPicker } from '../pos/CustomerPicker';
import { ordersApi } from '../../api/orders.api';
import { handleApiError } from '../../utils/api-error';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
  onSaved: (order: OrderDto) => void;
}

type CustomerPayload = { customerId?: string; createCustomer?: CreateCustomerRequest } | null;

/* ─── Static data (same icons as PaymentModal) ──────────────────────────── */

const ORDER_TYPES = [
  {
    value: OrderType.DINE_IN,
    label: 'Local',
    icon: <Icon name="card" size={20} strokeWidth={1.75} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-primary-400/50 hover:bg-primary-500/10 hover:text-primary-400',
    active: 'border-2 border-primary-500/70 bg-primary-500/18 text-primary-300',
  },
  {
    value: OrderType.TAKEOUT,
    label: 'Para Llevar',
    icon: <Icon name="bag" size={20} strokeWidth={1.75} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-400',
    active: 'border-2 border-amber-500/70 bg-amber-500/18 text-amber-300',
  },
  {
    value: OrderType.DELIVERY,
    label: 'Delivery',
    icon: <Icon name="map" size={20} strokeWidth={1.75} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400',
    active: 'border-2 border-emerald-500/70 bg-emerald-500/18 text-emerald-300',
  },
];

const PAYMENT_METHODS = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    icon: <Icon name="cash" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-400',
    active: 'border-2 border-emerald-500/70 bg-emerald-500/18 text-emerald-300',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    icon: <Icon name="qr" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-primary-400/50 hover:bg-primary-500/10 hover:text-primary-400',
    active: 'border-2 border-primary-500/70 bg-primary-500/18 text-primary-300',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    icon: <Icon name="card" size={24} strokeWidth={1.5} />,
    idle:   'border-2 border-white/12 bg-white/5 text-gray-500 hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-400',
    active: 'border-2 border-violet-500/70 bg-violet-500/18 text-violet-300',
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export function EditOrderModal({ isOpen, onClose, order, onSaved }: Props) {
  const [selectedType,    setSelectedType]    = useState<OrderType>(order.type);
  const [notes,           setNotes]           = useState(order.notes ?? '');
  const [customerValue,   setCustomerValue]   = useState<CustomerPayload>(null);
  const [pickerKey,       setPickerKey]       = useState(0);
  const [selectedMethod,  setSelectedMethod]  = useState<PaymentMethod | null>(
    order.isPaid && order.payments.length === 1 ? order.payments[0].method : null,
  );
  const [loading, setLoading] = useState(false);

  const canEditPayment = order.isPaid && order.payments.length === 1;

  useEffect(() => {
    if (isOpen) {
      setSelectedType(order.type);
      setNotes(order.notes ?? '');
      setCustomerValue(null);
      setPickerKey((k) => k + 1);
      setSelectedMethod(canEditPayment ? order.payments[0].method : null);
    }
  }, [isOpen, order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setLoading(true);
    try {
      const saved = await ordersApi.update(order.id, {
        type:  selectedType,
        notes: notes.trim() || null,
        ...(customerValue?.customerId     ? { customerId:     customerValue.customerId }     : {}),
        ...(customerValue?.createCustomer ? { createCustomer: customerValue.createCustomer } : {}),
        ...(canEditPayment && selectedMethod ? { paymentMethod: selectedMethod } : {}),
      });
      toast.success('Pedido actualizado');
      onSaved(saved);
    } catch (err) {
      handleApiError(err, 'Error al actualizar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar pedido #${order.orderNumber}`} size="md">
      <div className="space-y-5">

        {/* Order type */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tipo de pedido</p>
          <div className="grid grid-cols-3 gap-2">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={[
                  'flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-150',
                  selectedType === t.value ? t.active : t.idle,
                ].join(' ')}
              >
                {t.icon}
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment method — only for single-payment paid orders */}
        {canEditPayment && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMethod(m.value)}
                  className={[
                    'flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-150',
                    selectedMethod === m.value ? m.active : m.idle,
                  ].join(' ')}
                >
                  {m.icon}
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Customer */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
          {order.customer && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-sky-50 border border-sky-200">
              <div className="w-7 h-7 rounded-full bg-sky-200 flex items-center justify-center shrink-0">
                <Icon name="user" size={14} strokeWidth={2} className="text-sky-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sky-500 font-semibold leading-none mb-0.5">Cliente actual</p>
                <p className="text-sm font-bold text-sky-900 truncate">{order.customer.name}</p>
              </div>
              <span className="text-xs text-sky-400 shrink-0">Asignar nuevo abajo ↓</span>
            </div>
          )}
          <CustomerPicker key={pickerKey} onCustomerChange={setCustomerValue} />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notas</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Sin especificaciones especiales..."
            className="w-full border-2 border-gray-200 rounded-2xl px-3 py-2.5 text-sm resize-none
              focus:outline-none focus:border-primary-400 transition-colors placeholder-gray-400"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button fullWidth onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
