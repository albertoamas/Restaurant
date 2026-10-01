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

  // En celular (o con variant="drawer") es una hoja que sube desde abajo: queda al alcance
  // del pulgar. Desde `sm` es un diálogo centrado.
  const sheet = variant === 'drawer';
  const layout = sheet
    ? 'items-end'
    : 'items-end sm:items-center sm:p-4';
  const panel = sheet
    ? 'w-full rounded-t-dialog max-h-[92dvh] animate-slide-sheet'
    : `w-full ${sizes[size]} rounded-t-dialog sm:rounded-dialog max-h-[92dvh] sm:max-h-[85vh] max-sm:animate-slide-sheet sm:animate-in`;

  return createPortal(
    <div className={`fixed inset-0 z-50 flex justify-center ${layout}`}>
      <div className="absolute inset-0 bg-surface-overlay/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative z-10 flex flex-col outline-none bg-surface-card border border-line shadow-overlay ${panel}`}
      >
        {/* Asa: indica que es una hoja (solo cuando se muestra como tal). */}
        <div className={`${sheet ? 'flex' : 'flex sm:hidden'} justify-center pt-2.5`} aria-hidden="true">
          <div className="w-10 h-1 bg-line-strong rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between gap-3 pl-6 pr-3 py-3 sm:py-4 border-b border-line shrink-0">
            <h2 id={titleId} className="text-heading font-semibold text-main font-heading">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-main hover:bg-surface-2 transition-colors"
            >
              <Icon name="x" size={18} strokeWidth={2} />
            </button>
          </div>
        )}
        <div data-modal-body className="px-6 py-5 overflow-y-auto min-h-0 flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-line shrink-0">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
