import { useState } from 'react';
import toast from 'react-hot-toast';
import { OrderNumberResetPeriod } from '@pos/shared';
import { useSettingsStore } from '../store/settings.store';
import { useAuth } from '../context/auth.context';
import { adminApi } from '../api/admin.api';
import { tenantsApi } from '../api/tenants.api';
import { ordersApi } from '../api/orders.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Icon } from '../components/ui/Icon';
import { PageShell } from '../components/ui/PageShell';
import { handleApiError } from '../utils/api-error';

const SETTINGS_UNLOCK_KEY = 'pos_settings_unlocked';

function SettingsLock({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.ping(key.trim());
      sessionStorage.setItem(SETTINGS_UNLOCK_KEY, '1');
      onUnlock();
    } catch {
      setError('Clave incorrecta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-sm mx-auto mt-16 animate-in">
      <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-xl p-8 text-center" style={{ background: 'var(--color-surface-card)' }}>
        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-5">
          <Icon name="lock" size={28} className="text-primary-600" />
        </div>
        <h2 className="font-heading font-black text-xl text-gray-900 mb-1">Ajustes protegidos</h2>
        <p className="text-sm text-gray-500 mb-6">Esta sección es solo para el administrador del sistema.</p>
        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <Input
            label="Clave de administrador"
            type="password"
            placeholder="••••••••"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            autoFocus
            required
          />
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Verificando...' : 'Desbloquear'}
          </Button>
        </form>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
}

function SettingRow({ label, description, value, onChange, icon }: SettingRowProps) {
  return (
    <div className={[
      'flex items-center justify-between py-4 px-1 rounded-xl transition-colors',
      value ? 'bg-primary-500/8' : '',
    ].join(' ')}>
      <div className="flex items-start gap-3 flex-1 pr-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          value ? 'bg-primary-500/15 text-primary-600' : 'bg-[var(--color-surface-2)] text-gray-400'
        }`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <Toggle checked={value} onChange={() => onChange(!value)} />
    </div>
  );
}

const RECEIPT_MAX = 120;

export function SettingsPage() {
  const { user } = useAuth();
  const {
    autoPrintKitchen, setAutoPrintKitchen,
    businessAddress, setBusinessAddress,
    businessPhone, setBusinessPhone,
    receiptSlogan, setReceiptSlogan,
    orderNumberResetPeriod, setOrderNumberResetPeriod,
  } = useSettingsStore();

  const saveReceiptField = async (field: 'businessAddress' | 'businessPhone' | 'receiptSlogan', value: string) => {
    try {
      await tenantsApi.updateSettings({ [field]: value || null });
    } catch (err) {
      handleApiError(err, 'Error al guardar');
    }
  };

  const [resetPeriodLoading, setResetPeriodLoading] = useState(false);
  const [resetNowConfirm, setResetNowConfirm] = useState(false);
  const [resetNowLoading, setResetNowLoading] = useState(false);

  const [unlocked, setUnlocked] = useState(() =>
    sessionStorage.getItem(SETTINGS_UNLOCK_KEY) === '1',
  );

  if (!unlocked) return <SettingsLock onUnlock={() => setUnlocked(true)} />;

  return (
    <PageShell className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-xl p-4 sm:p-5" style={{ background: 'var(--color-surface-card)' }}>
        <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Ajustes del Negocio</h2>
        <p className="text-xs text-gray-500 mt-1">Configura impresión, datos del recibo y seguridad de acceso.</p>
      </div>

      {/* Business data */}
      <Card variant="panel">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="building" size={16} className="text-gray-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-700">Datos del negocio</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-6">Aparecen en el recibo que se entrega al cliente</p>
        <div className="divide-y divide-[var(--border-subtle)]">
          <div className="py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre del negocio</label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] rounded-xl px-4 py-3 border border-[var(--border-subtle)]">
              <span className="text-sm font-semibold text-gray-800">{user?.tenantName || '—'}</span>
              <span className="ml-auto text-xs text-gray-400 bg-[var(--color-surface-3)] rounded-md px-2 py-0.5">Solo lectura</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Se define al registrarse. Contacta soporte para cambiarlo.</p>
          </div>
          <div className="py-4">
            <Input
              label="Dirección"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              onBlur={(e) => saveReceiptField('businessAddress', e.target.value)}
              placeholder="Ej: Av. Los Pinos 123, Santa Cruz"
            />
          </div>
          <div className="py-4">
            <Input
              label="Teléfono"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              onBlur={(e) => saveReceiptField('businessPhone', e.target.value)}
              placeholder="Ej: +591 77712345"
            />
          </div>
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Eslogan del recibo</label>
              <span className={`text-xs font-medium ${receiptSlogan.length > RECEIPT_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                {receiptSlogan.length}/{RECEIPT_MAX}
              </span>
            </div>
            <textarea
              value={receiptSlogan}
              onChange={(e) => setReceiptSlogan(e.target.value)}
              onBlur={(e) => saveReceiptField('receiptSlogan', e.target.value)}
              placeholder="Ej: El mejor sabor de la ciudad"
              rows={2}
              maxLength={RECEIPT_MAX}
              className="w-full text-sm border border-[var(--border-subtle)] rounded-xl px-3 py-2.5
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                resize-none transition-[border-color,box-shadow] bg-[var(--color-surface-card)] text-gray-700"
            />
            <p className="text-xs text-gray-400 mt-1.5">Aparece debajo del nombre del negocio en el recibo</p>
          </div>
        </div>
      </Card>

      {/* Order numbering */}
      <Card variant="panel">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="hash" size={16} className="text-gray-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-700">Numeración de pedidos</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-6">Define cada cuándo se reinicia el contador de pedidos (#1, #2, #3…)</p>
        <div className="flex gap-3">
          {[
            { value: OrderNumberResetPeriod.DAILY,   label: 'Diario',   desc: 'Se reinicia cada día' },
            { value: OrderNumberResetPeriod.MONTHLY, label: 'Mensual',  desc: 'Se reinicia cada mes' },
          ].map((opt) => {
            const active = orderNumberResetPeriod === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={resetPeriodLoading}
                onClick={async () => {
                  if (active) return;
                  setResetPeriodLoading(true);
                  try {
                    await tenantsApi.updateSettings({ orderNumberResetPeriod: opt.value });
                    setOrderNumberResetPeriod(opt.value);
                    toast.success('Configuración guardada');
                  } catch (err) {
                    handleApiError(err, 'Error al guardar');
                  } finally {
                    setResetPeriodLoading(false);
                  }
                }}
                className={[
                  'flex-1 rounded-xl border-2 px-4 py-3 text-left transition-all',
                  active
                    ? 'border-primary-500/50 bg-primary-500/10 text-primary-700'
                    : 'border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-gray-500 hover:border-[var(--border-strong)]',
                  resetPeriodLoading ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          {!resetNowConfirm ? (
            <button
              type="button"
              onClick={() => setResetNowConfirm(true)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors group"
            >
              <Icon name="refresh" size={16} className="group-hover:text-amber-500 transition-colors" />
              Reiniciar contador ahora
            </button>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900 mb-0.5">¿Reiniciar el contador ahora?</p>
              <p className="text-xs text-amber-700 mb-3">
                El próximo pedido empezará desde <strong>#1</strong>. Los pedidos existentes conservan su número.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setResetNowConfirm(false)}
                  disabled={resetNowLoading}
                  className="text-xs py-1.5 px-3 h-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  loading={resetNowLoading}
                  onClick={async () => {
                    setResetNowLoading(true);
                    try {
                      await ordersApi.resetSequence();
                      toast.success('Contador reiniciado — el próximo pedido será #1');
                      setResetNowConfirm(false);
                    } catch (err) {
                      handleApiError(err, 'Error al reiniciar contador');
                    } finally {
                      setResetNowLoading(false);
                    }
                  }}
                  className="text-xs py-1.5 px-3 h-auto"
                >
                  Sí, reiniciar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Printing */}
      <Card variant="panel">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="print" size={16} className="text-gray-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-700">Impresión</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-6">Opciones de impresión de comandas</p>
        <div className="space-y-1">
          <SettingRow
            label="Imprimir comanda automáticamente"
            description="Al confirmar un pedido, se envía la comanda a la impresora de cocina sin clic adicional."
            value={autoPrintKitchen}
            onChange={setAutoPrintKitchen}
            icon={<Icon name="print" size={16} />}
          />
        </div>
      </Card>

    </PageShell>
  );
}
