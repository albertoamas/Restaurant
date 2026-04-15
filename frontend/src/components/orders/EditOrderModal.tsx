import { useState, useEffect } from 'react';
import { OrderType, PaymentMethod } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700',
    active: 'border-2 border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-200 shadow-sm',
  },
  {
    value: OrderType.TAKEOUT,
    label: 'Para Llevar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700',
    active: 'border-2 border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-200 shadow-sm',
  },
  {
    value: OrderType.DELIVERY,
    label: 'Delivery',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700',
    active: 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 shadow-sm',
  },
];

const PAYMENT_METHODS = [
  {
    value: PaymentMethod.CASH,
    label: 'Efectivo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700',
    active: 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 shadow-sm',
  },
  {
    value: PaymentMethod.QR,
    label: 'QR',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-700',
    active: 'border-2 border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-200 shadow-sm',
  },
  {
    value: PaymentMethod.TRANSFER,
    label: 'Transferencia',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    idle:   'border-2 border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:bg-violet-50/60 hover:text-violet-700',
    active: 'border-2 border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200 shadow-sm',
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
                <svg className="w-3.5 h-3.5 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
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
