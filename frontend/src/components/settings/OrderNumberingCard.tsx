import { useState } from 'react';
import toast from 'react-hot-toast';
import { OrderNumberResetPeriod } from '@pos/shared';
import { ordersApi } from '../../api/orders.api';
import { tenantsApi } from '../../api/tenants.api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Icon } from '../ui/Icon';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useSettingsStore } from '../../store/settings.store';
import { handleApiError } from '../../utils/api-error';

const PERIOD_HINT: Record<OrderNumberResetPeriod, string> = {
  [OrderNumberResetPeriod.DAILY]:   'Cada día el primer pedido vuelve a ser el 1.',
  [OrderNumberResetPeriod.MONTHLY]: 'El primer pedido de cada mes vuelve a ser el 1.',
};

/** Cada cuándo vuelve a empezar el número de pedido, y reiniciarlo a mano (en todas las sucursales). */
export function OrderNumberingCard() {
  const period    = useSettingsStore((s) => s.orderNumberResetPeriod);
  const setPeriod = useSettingsStore((s) => s.setOrderNumberResetPeriod);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting]       = useState(false);

  const changePeriod = async (value: OrderNumberResetPeriod) => {
    if (value === period || savingPeriod) return;
    setSavingPeriod(true);
    try {
      await tenantsApi.updateSettings({ orderNumberResetPeriod: value });
      setPeriod(value);
      toast.success(value === OrderNumberResetPeriod.DAILY ? 'El número de pedido se reinicia cada día' : 'El número de pedido se reinicia cada mes');
    } catch (err) {
      handleApiError(err, 'Error al guardar la numeración');
    } finally {
      setSavingPeriod(false);
    }
  };

  const resetNow = async () => {
    setResetting(true);
    try {
      await ordersApi.resetSequence();
      toast.success('Listo: el próximo pedido de cada sucursal es el 1');
      setConfirmReset(false);
    } catch (err) {
      handleApiError(err, 'Error al reiniciar el contador');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Card>
      <h3 className="text-heading font-semibold text-main">Numeración de pedidos</h3>
      <p className="mt-0.5 text-label text-soft">Cada cuándo vuelve a empezar el número de pedido.</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          label="Reinicio del número de pedido"
          value={period}
          onChange={changePeriod}
          options={[
            { value: OrderNumberResetPeriod.DAILY,   label: 'Cada día' },
            { value: OrderNumberResetPeriod.MONTHLY, label: 'Cada mes' },
          ]}
        />
        <p className="text-label text-soft">{PERIOD_HINT[period]}</p>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-label text-soft">Para empezar de nuevo hoy, por ejemplo al abrir una temporada.</p>
        <Button variant="secondary" onClick={() => setConfirmReset(true)} className="shrink-0">
          <Icon name="refresh" size={16} />
          Reiniciar contador ahora
        </Button>
      </div>

      <ConfirmModal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetNow}
        loading={resetting}
        title="Reiniciar el contador de pedidos"
        message="El próximo pedido de cada sucursal empieza en el 1. Los pedidos ya hechos conservan su número."
        confirmLabel="Reiniciar"
        cancelLabel="Volver"
      />
    </Card>
  );
}
