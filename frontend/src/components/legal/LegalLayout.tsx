import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';

/**
 * Cabecera + pie compartidos por las páginas legales (Términos, Privacidad).
 * Mismo lenguaje visual que LandingPage: logo, tokens de tema, footer.
 */
export function LegalLayout({
  icon, title, updatedAt, children,
}: {
  icon: IconName;
  title: string;
  /** Fecha de última actualización, ej. "21 de septiembre de 2026". */
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-page)] text-[var(--color-text-main)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--color-surface-page)]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--color-surface-page)]/60">
        <div className="mx-auto flex h-16 max-w-[860px] items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <span className="font-heading text-lg font-black tracking-tight text-[var(--color-text-main)]">
              Yanko<span className="text-primary-500">POS</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-[13px] font-semibold text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-text-main)]">
            <Icon name="chevron-left" size={14} strokeWidth={2.5} />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[860px] px-5 py-12 sm:py-16">
        <div className="mb-10">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
            <Icon name={icon} size={20} />
          </div>
          <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Última actualización: {updatedAt}</p>
        </div>

        <div className="space-y-8">
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--border-subtle)] px-5 py-10">
        <div className="mx-auto flex max-w-[860px] flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} YankoPOS · Hecho en Bolivia 🇧🇴
          </p>
          <nav className="flex gap-6">
            <Link to="/terminos" className="text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-primary-500">
              Términos y Condiciones
            </Link>
            <Link to="/privacidad" className="text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-primary-500">
              Política de Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Sección con título: unidad de contenido repetida en ambos documentos. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-heading text-xl font-bold text-[var(--color-text-main)]">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[var(--color-text-soft)]">{children}</div>
    </section>
  );
}

/** Párrafo dentro de una sección legal. */
export function LegalP({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

/** Lista con viñetas dentro de una sección legal. */
export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
