import { useEffect, useState } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// El menú de usuario se desmonta al cerrarse, así que el modal de iOS no puede vivir dentro
// de él: la opción del menú lo abre con este evento y `IosInstallHelp` (montado una vez en
// main.tsx) lo muestra.
const IOS_HELP_EVENT = 'pwa:ios-install-help';

interface InstallAppMenuItemProps {
  /** Cierra el menú que contiene la opción. */
  onSelect: () => void;
}

/**
 * Opción "Instalar app" del menú de usuario. No se muestra si la app ya está instalada o si
 * el navegador no permite instalarla. En iPhone/iPad no hay diálogo nativo: se explican los pasos.
 */
export function InstallAppMenuItem({ onSelect }: InstallAppMenuItemProps) {
  const { mode, promptInstall } = usePwaInstall();
  if (mode === 'none') return null;

  const handleClick = () => {
    onSelect();
    if (mode === 'ios') window.dispatchEvent(new Event(IOS_HELP_EVENT));
    else void promptInstall();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-soft hover:text-main hover:bg-surface-2 transition-colors"
      >
        <Icon name="download" size={16} className="shrink-0" />
        Instalar app
      </button>
      <div className="h-px bg-line mx-3" />
    </>
  );
}

export function IosInstallHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(IOS_HELP_EVENT, show);
    return () => window.removeEventListener(IOS_HELP_EVENT, show);
  }, []);

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Instalar YankoPOS"
      size="sm"
      footer={
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        </div>
      }
    >
      <ol className="list-decimal pl-5 space-y-2 text-sm text-soft">
        <li>
          Toca el botón <span className="font-semibold text-main">Compartir</span>{' '}
          (el cuadrado con una flecha hacia arriba).
        </li>
        <li>
          Elige <span className="font-semibold text-main">Agregar a inicio</span>.
        </li>
        <li>La app aparecerá en tu pantalla de inicio y se abrirá sin la barra del navegador.</li>
      </ol>
    </Modal>
  );
}
