import { useState, useEffect } from 'react';
import { OrderType, PaymentMethod } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import type { CreateCustomerRequest } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { Textarea } from '../ui/Input';
import { CustomerPicker } from '../pos/CustomerPicker';
import { PAYMENT_METHODS, optionClass } from '../pos/PaymentMethodSection';
import { orderTypeLabels } from '../../utils/order';
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

const ORDER_TYPES: { value: OrderType; icon: IconName }[] = [
  { value: OrderType.DINE_IN,  icon: 'card' },
  { value: OrderType.TAKEOUT,  icon: 'bag' },
  { value: OrderType.DELIVERY, icon: 'map' },
];

/** Cortesía no se ofrece al editar: cambiaría el total cobrado. */
const EDITABLE_METHODS = PAYMENT_METHODS.filter((m) => m.value !== PaymentMethod.CORTESIA);

export function EditOrderModal({ isOpen, onClose, order, onSaved }: Props) {
  const [selectedType,    setSelectedType]    = useState<OrderType>(order.type);
  const [notes,           setNotes]           = useState(order.notes ?? '');
  const [customerValue,   setCustomerValue]   = useState<CustomerPayload>(null);
  const [pickerKey,       setPickerKey]       = useState(0);
  const [showPicker,      setShowPicker]      = useState(!order.customer);
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
      setShowPicker(!order.customer);
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

  const sectionTitle = 'text-label font-semibold text-soft mb-2';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar pedido #${order.orderNumber}`}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button fullWidth onClick={handleSave} loading={loading}>
            {loading ? 'Guardando' : 'Guardar cambios'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className={sectionTitle}>Tipo de pedido</p>
          <div role="radiogroup" aria-label="Tipo de pedido" className="grid grid-cols-3 gap-2">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={selectedType === t.value}
                onClick={() => setSelectedType(t.value)}
                className={`${optionClass(selectedType === t.value)} min-h-18 py-3 px-2`}
              >
                <Icon name={t.icon} size={20} strokeWidth={1.75} />
                <span className="text-label font-semibold">{orderTypeLabels[t.value]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Solo con un único pago: cambiar el método de un pago dividido no tiene un sentido claro. */}
        {canEditPayment && (
          <div>
            <p className={sectionTitle}>Método de pago</p>
            <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-3 gap-2">
              {EDITABLE_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={selectedMethod === m.value}
                  onClick={() => setSelectedMethod(m.value)}
                  className={`${optionClass(selectedMethod === m.value)} min-h-18 py-3 px-2`}
                >
                  <Icon name={m.icon} size={20} strokeWidth={1.75} />
                  <span className="text-label font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className={sectionTitle}>Cliente</p>

          {order.customer && !showPicker && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-control bg-surface-2 border border-line">
              <span className="w-9 h-9 rounded-full bg-primary-500/15 flex items-center justify-center shrink-0 text-primary-700 dark:text-primary-300">
                <Icon name="user" size={16} strokeWidth={2} />
              </span>
              <p className="flex-1 min-w-0 text-body font-semibold text-main truncate">{order.customer.name}</p>
              <Button variant="secondary" size="sm" onClick={() => setShowPicker(true)}>Cambiar</Button>
            </div>
          )}

          {showPicker && (
            <div className="space-y-2">
              {order.customer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowPicker(false); setCustomerValue(null); setPickerKey((k) => k + 1); }}
                >
                  <Icon name="chevron-left" size={14} strokeWidth={2} />
                  Mantener a {order.customer.name}
                </Button>
              )}
              <CustomerPicker key={pickerKey} onCustomerChange={setCustomerValue} />
            </div>
          )}
        </div>

        <Textarea
          label="Nota"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Sin especificaciones"
        />
      </div>
    </Modal>
  );
}
