import { useState } from 'react';
import toast from 'react-hot-toast';
import { tenantsApi } from '../../api/tenants.api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { useSettingsStore } from '../../store/settings.store';
import { handleApiError } from '../../utils/api-error';

const SLOGAN_MAX = 120;

/**
 * Encabezado del recibo como sale impreso. El papel es blanco también en tema oscuro: muestra el
 * ticket real, no una superficie de la app.
 */
function ReceiptPreview({ name, address, phone, slogan }: { name: string; address: string; phone: string; slogan: string }) {
  return (
    <div aria-label="Vista previa del recibo" className="mx-auto w-full max-w-[260px] rounded-control border border-line bg-white px-4 py-5 text-center font-mono text-[12px] leading-snug text-neutral-900 shadow-raised">
      <p className="text-[14px] font-bold">{name || 'Tu negocio'}</p>
      {address && <p>{address}</p>}
      {phone && <p>Tel: {phone}</p>}
      {slogan && <p className="italic">{slogan}</p>}
      <div className="my-3 border-t border-dashed border-neutral-400" />
      <div className="flex justify-between"><span>2 x Producto</span><span>Bs 30.00</span></div>
      <div className="mt-1 flex justify-between font-bold"><span>TOTAL</span><span>Bs 30.00</span></div>
      <div className="my-3 border-t border-dashed border-neutral-400" />
      <p>¡Gracias por su compra!</p>
    </div>
  );
}

/** Datos que salen en el recibo. Se guardan con un botón: antes se guardaban al salir de cada campo, sin avisar. */
export function ReceiptSettingsCard({ businessName }: { businessName: string }) {
  const saved = {
    address: useSettingsStore((s) => s.businessAddress),
    phone:   useSettingsStore((s) => s.businessPhone),
    slogan:  useSettingsStore((s) => s.receiptSlogan),
  };
  const { setBusinessAddress, setBusinessPhone, setReceiptSlogan } = useSettingsStore();
  const [address, setAddress] = useState(saved.address);
  const [phone, setPhone]     = useState(saved.phone);
  const [slogan, setSlogan]   = useState(saved.slogan);
  const [saving, setSaving]   = useState(false);

  const dirty = address.trim() !== saved.address || phone.trim() !== saved.phone || slogan.trim() !== saved.slogan;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    const next = { address: address.trim(), phone: phone.trim(), slogan: slogan.trim() };
    setSaving(true);
    try {
      await tenantsApi.updateSettings({
        businessAddress: next.address || null,
        businessPhone:   next.phone || null,
        receiptSlogan:   next.slogan || null,
      });
      setBusinessAddress(next.address);
      setBusinessPhone(next.phone);
      setReceiptSlogan(next.slogan);
      setAddress(next.address);
      setPhone(next.phone);
      setSlogan(next.slogan);
      toast.success('Datos del recibo guardados');
    } catch (err) {
      handleApiError(err, 'Error al guardar los datos del recibo');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => { setAddress(saved.address); setPhone(saved.phone); setSlogan(saved.slogan); };

  return (
    <Card>
      <h3 className="text-heading font-semibold text-main">Datos del recibo</h3>
      <p className="mt-0.5 text-label text-soft">Salen en el recibo que se entrega al cliente.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <form id="receipt-settings" onSubmit={save} className="space-y-4">
          <div>
            <p className="text-label font-medium text-soft">Nombre del negocio</p>
            <p className="mt-1 text-body font-semibold text-main">{businessName || '-'}</p>
            <p className="mt-0.5 text-caption text-muted">Para cambiarlo, escribe a soporte.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dirección" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={255} placeholder="Ej.: Av. Los Pinos 123, Santa Cruz" />
            <Input label="Teléfono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} placeholder="Ej.: +591 77712345" />
          </div>
          <Textarea
            label="Eslogan del recibo"
            rows={2}
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            maxLength={SLOGAN_MAX}
            placeholder="Ej.: El mejor sabor de la ciudad"
            hint={`Sale debajo del nombre. ${slogan.length} de ${SLOGAN_MAX} caracteres.`}
          />
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {dirty && <Button type="button" variant="ghost" onClick={discard} disabled={saving}>Descartar</Button>}
            <Button type="submit" loading={saving} disabled={!dirty}>Guardar cambios</Button>
          </div>
        </form>

        <div>
          <p className="mb-2 text-label font-medium text-soft lg:text-center">Así se ve</p>
          <ReceiptPreview name={businessName} address={address.trim()} phone={phone.trim()} slogan={slogan.trim()} />
        </div>
      </div>
    </Card>
  );
}
