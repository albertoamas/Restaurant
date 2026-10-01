import type { ReactNode } from 'react';
import { useSettingsStore } from '../store/settings.store';
import { useAuth } from '../context/auth.context';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { Toggle } from '../components/ui/Toggle';
import { ReceiptSettingsCard } from '../components/settings/ReceiptSettingsCard';
import { OrderNumberingCard } from '../components/settings/OrderNumberingCard';

/** Grupo de ajustes con su alcance: del negocio (todos) o de este dispositivo. */
function SettingsGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-heading font-bold text-main">{title}</h2>
        <p className="text-label text-soft">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SettingRow({ icon, label, description, checked, onChange }: {
  icon: IconName; label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-2 text-soft">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-main">{label}</p>
        <p className="text-label text-soft">{description}</p>
      </div>
      <Toggle checked={checked} onChange={() => onChange(!checked)} label={label} />
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const { autoPrintKitchen, setAutoPrintKitchen, showProductImages, setShowProductImages } = useSettingsStore();
  // Sin candado: la ruta ya es solo del dueño (OwnerRoute) y el backend exige su JWT con rol OWNER.
  // Antes pedía ADMIN_SECRET, la clave del panel /admin, que un cliente nunca tiene.

  return (
    <PageShell>
      <PageHeader title="Configuración" description="Datos del recibo, numeración de pedidos y preferencias de este dispositivo." />

      <div className="space-y-10">
        <SettingsGroup title="Tu negocio" description="Vale para todas las sucursales y dispositivos.">
          <ReceiptSettingsCard businessName={user?.tenantName ?? ''} />
          <OrderNumberingCard />
        </SettingsGroup>

        <SettingsGroup title="Este dispositivo" description="Vale solo en esta computadora o celular. Cada caja elige lo suyo.">
          <Card padding="none" className="divide-y divide-line">
            <SettingRow
              icon="photo"
              label="Fotos de los productos"
              description="En el punto de venta. Apágalo para una vista compacta con solo nombre y precio."
              checked={showProductImages}
              onChange={setShowProductImages}
            />
            <SettingRow
              icon="print"
              label="Imprimir la comanda al confirmar"
              description="Al confirmar un pedido se imprime la comanda de cocina sin otro clic."
              checked={autoPrintKitchen}
              onChange={setAutoPrintKitchen}
            />
          </Card>
        </SettingsGroup>
      </div>
    </PageShell>
  );
}
