import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './Icon';

export interface ActionMenuItem {
  label: string;
  icon: IconName;
  onSelect: () => void;
  /** Acción destructiva (cancelar, eliminar): va en rojo y al final. */
  danger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Nombre accesible del botón (ej.: "Más acciones del pedido #6"). */
  label: string;
}

const MENU_WIDTH = 224;
const GAP = 6;

/**
 * Botón "Más" con un menú de acciones secundarias. El menú se dibuja en el body (no lo recorta
 * una tabla con scroll ni una tarjeta con overflow) y se abre hacia arriba si abajo no hay lugar.
 * Accesible: Escape y clic afuera cierran, las flechas recorren y el foco vuelve al botón.
 */
export function ActionMenu({ items, label }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const place = () => {
      const r = buttonRef.current!.getBoundingClientRect();
      const height = menuRef.current?.offsetHeight ?? items.length * 44 + 8;
      const below = r.bottom + GAP + height <= window.innerHeight;
      setPos({
        top: below ? r.bottom + GAP : Math.max(8, r.top - GAP - height),
        left: Math.min(Math.max(8, r.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = () => { setOpen(false); buttonRef.current?.focus(); };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); itemRefs.current[(i + 1) % items.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); itemRefs.current[(i - 1 + items.length) % items.length]?.focus(); }
    else if (e.key === 'Tab') close();
  };

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-control border border-line bg-surface-card text-soft hover:text-main hover:bg-surface-2 hover:border-line-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
      >
        <Icon name="more" size={20} strokeWidth={3.2} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: MENU_WIDTH }}
          className="z-[55] py-1 rounded-card border border-line bg-surface-card shadow-floating animate-in"
        >
          {items.map((item, i) => (
            <button
              key={item.label}
              ref={(el) => { itemRefs.current[i] = el; }}
              role="menuitem"
              type="button"
              onClick={() => { setOpen(false); item.onSelect(); }}
              className={[
                'flex items-center gap-2.5 w-full min-h-11 px-3.5 text-body text-left transition-colors focus-visible:outline-none',
                item.danger
                  ? 'text-red-700 dark:text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/10'
                  : 'text-main hover:bg-surface-2 focus-visible:bg-surface-2',
              ].join(' ')}
            >
              <Icon name={item.icon} size={17} className="shrink-0" />
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
