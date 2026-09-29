import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | '2xl' | '3xl' | '4xl';
  variant?: 'dialog' | 'drawer';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento de diálogo accesible: Escape cierra, Tab no sale del diálogo, el foco entra
 * al abrir y vuelve al elemento que lo abrió al cerrar.
 */
function useDialogBehavior(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    // Con mouse/teclado: el primer campo del contenido (no el botón de cerrar). En pantallas
    // táctiles, el diálogo mismo: enfocar un campo abriría el teclado en pantalla en cada modal.
    const touch = window.matchMedia?.('(pointer: coarse)').matches;
    const first = touch ? null : dialog?.querySelector<HTMLElement>(`[data-modal-body] :is(${FOCUSABLE})`);
    (first ?? dialog)?.focus();
    return () => opener?.focus?.();
  }, [isOpen]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Un campo interno que ya atendió la tecla (ej.: Escape cancela una edición en línea) gana.
    if (e.defaultPrevented) return;
    if (e.key === 'Escape') {
      e.stopPropagation(); // con modales apilados, cierra solo el de arriba
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return { dialogRef, onKeyDown };
}

const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
  '4xl': 'max-w-6xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  variant = 'dialog',
}: ModalProps) {
  const titleId = useId();
  const { dialogRef, onKeyDown } = useDialogBehavior(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  if (variant === 'drawer') {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-end">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          role="dialog"
          ref={dialogRef}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className="relative w-full outline-none border-t border-line rounded-t-2xl shadow-[0_-8px_32px_oklch(0.06_0.010_38/0.7)] z-10 animate-slide-sheet"
          style={{ background: 'var(--color-surface-card)' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-surface-3 rounded-full" aria-hidden="true" />
          </div>
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 id={titleId} className="text-base font-bold text-gray-800 font-heading">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icon name="x" size={16} strokeWidth={2} />
              </button>
            </div>
          )}
          <div data-modal-body className="px-6 py-4">{children}</div>
          {footer && (
            <div className="px-6 pb-6 pt-2 border-t border-line mt-2">{footer}</div>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={[
          'relative rounded-2xl w-full z-10 animate-in outline-none',
          'shadow-[0_24px_48px_oklch(0.06_0.010_38/0.8),0_4px_16px_oklch(0.06_0.010_38/0.4)]',
          'ring-1 ring-line',
          sizes[size],
        ].join(' ')}
        style={{ background: 'var(--color-surface-card)' }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-line">
            <h2 id={titleId} className="text-base font-bold text-gray-800 font-heading">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Icon name="x" size={16} strokeWidth={2} />
            </button>
          </div>
        )}
        <div data-modal-body className="px-6 py-5 overflow-y-auto max-h-[80vh]">{children}</div>
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-line">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
