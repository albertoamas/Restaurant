import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../store/settings.store';
import { useAuth } from '../context/auth.context';
import { usersApi } from '../api/users.api';
import { adminApi } from '../api/admin.api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
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
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
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
      value ? 'bg-primary-50/40' : '',
    ].join(' ')}>
      <div className="flex items-start gap-3 flex-1 pr-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
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
const EMPTY_PW = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function SettingsPage() {
  const { user } = useAuth();
  const {
    autoPrintKitchen, setAutoPrintKitchen,
    raffleThreshold, setRaffleThreshold,
    businessAddress, setBusinessAddress,
    businessPhone, setBusinessPhone,
    receiptFooter, setReceiptFooter,
  } = useSettingsStore();

  const [unlocked, setUnlocked] = useState(() =>
    sessionStorage.getItem(SETTINGS_UNLOCK_KEY) === '1',
  );
  const [pw, setPw] = useState(EMPTY_PW);
  const [pwLoading, setPwLoading] = useState(false);

  if (!unlocked) return <SettingsLock onUnlock={() => setUnlocked(true)} />;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setPwLoading(true);
    try {
      await usersApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success('Contraseña actualizada');
      setPw(EMPTY_PW);
    } catch (err) {
      handleApiError(err, 'Error al cambiar contraseña');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto animate-slide space-y-4">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5">
        <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Ajustes del Negocio</h2>
        <p className="text-xs text-gray-500 mt-1">Configura impresión, datos del recibo y seguridad de acceso.</p>
      </div>

      {/* Business data */}
      <Card variant="panel">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Datos del negocio</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-6">Aparecen en el recibo que se entrega al cliente</p>
        <div className="divide-y divide-gray-100">
          <div className="py-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre del negocio</label>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <span className="text-sm font-semibold text-gray-800">{user?.tenantName || '—'}</span>
              <span className="ml-auto text-xs text-gray-400 bg-gray-200 rounded-md px-2 py-0.5">Solo lectura</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Se define al registrarse. Contacta soporte para cambiarlo.</p>
          </div>
          <div className="py-4">
            <Input
              label="Bs por ficha de sorteo"
              type="number"
              min="1"
              step="1"
              value={String(raffleThreshold)}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (v > 0) setRaffleThreshold(v);
              }}
              placeholder="Ej: 100"
            />
            <p className="text-xs text-gray-400 mt-1.5">El cliente recibe una ficha por cada {raffleThreshold} Bs acumulados en compras</p>
          </div>
          <div className="py-4">
            <Input
              label="Dirección"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Ej: Av. Los Pinos 123, Santa Cruz"
            />
          </div>
          <div className="py-4">
            <Input
              label="Teléfono"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="Ej: +591 77712345"
            />
          </div>
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Mensaje en el recibo</label>
              <span className={`text-xs font-medium ${receiptFooter.length > RECEIPT_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                {receiptFooter.length}/{RECEIPT_MAX}
              </span>
            </div>
            <textarea
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Ej: ¡Gracias por su compra!"
              rows={2}
              maxLength={RECEIPT_MAX}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                resize-none transition-[border-color,box-shadow] bg-white"
            />
          </div>
        </div>
      </Card>

      {/* Printing */}
      <Card variant="panel">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Impresión</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-6">Opciones de impresión de comandas</p>
        <div className="space-y-1">
          <SettingRow
            label="Imprimir comanda automáticamente"
            description="Al confirmar un pedido, se envía la comanda a la impresora de cocina sin clic adicional."
            value={autoPrintKitchen}
            onChange={setAutoPrintKitchen}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }
          />
        </div>
      </Card>

      {/* Password change */}
      <Card variant="panel">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-sm font-bold text-gray-700">Seguridad</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-6">Cambia tu contraseña de acceso</p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            minLength={6}
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={pw.confirmPassword}
            onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
            minLength={6}
            required
          />
          <Button type="submit" loading={pwLoading}>
            Cambiar contraseña
          </Button>
        </form>
      </Card>
    </div>
  );
}
