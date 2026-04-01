import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  variant?: 'dialog' | 'drawer';
}

const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  full: 'max-w-2xl',
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
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full bg-white rounded-t-2xl shadow-[0_-8px_32px_oklch(0.13_0.012_260/0.15)] z-10 animate-slide-sheet">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 font-heading">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
          {footer && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 mt-2">{footer}</div>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={[
        'relative bg-white rounded-2xl w-full z-10 animate-in',
        'shadow-[0_20px_60px_oklch(0.13_0.012_260/0.15),0_4px_16px_oklch(0.13_0.012_260/0.08)]',
        'ring-1 ring-black/5',
        sizes[size],
      ].join(' ')}>
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 font-heading">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto max-h-[80vh]">{children}</div>
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
