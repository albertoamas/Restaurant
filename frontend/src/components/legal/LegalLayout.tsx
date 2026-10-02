import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../ui/Icon';
import { Select } from '../ui/Input';

export interface LegalSectionRef {
  /** Ancla de la sección (`/terminos#pagos`). */
  id: string;
  title: string;
}

export const LEGAL_CONTACT_EMAIL = 'albertoamasv@gmail.com';
export const LEGAL_WHATSAPP = '+591 74526068';
export const LEGAL_WHATSAPP_URL = 'https://wa.me/59174526068';

const link = 'font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-400';

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary-600 text-white shadow-raised">
        <Icon name="cart" size={18} strokeWidth={2} />
      </span>
      <span className="font-heading text-heading font-bold text-main">
        Yanko<span className="text-primary-600 dark:text-primary-400">POS</span>
      </span>
    </span>
  );
}

/**
 * Sección que se está leyendo: la última cuyo título ya pasó justo debajo del encabezado fijo
 * (las secciones saltan con `scroll-mt-24`, 96 px).
 */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const onScroll = () => {
      const line = 120;
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // Las últimas secciones, cortas, nunca suben hasta la línea: al tocar fondo manda el ancla
      // elegida en el índice.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      const hash = location.hash.slice(1);
      if (atBottom && ids.includes(hash)) current = hash;
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids]);
  return active;
}

/**
 * Página legal (Términos, Privacidad): encabezado y pie de la landing, índice lateral fijo en
 * escritorio y desplegable "Ir a la sección" en celular. Cada sección tiene su ancla.
 */
export function LegalLayout({ icon, title, summary, updatedAt, sections, children }: {
  icon: IconName;
  title: string;
  /** Una frase: qué cubre el documento. */
  summary: string;
  /** Fecha de última actualización, ej. "2 de octubre de 2026". */
  updatedAt: string;
  sections: LegalSectionRef[];
  children: ReactNode;
}) {
  const ids = sections.map((s) => s.id);
  const active = useActiveSection(ids);

  // Un enlace con ancla (/privacidad#navegador) llega antes de que la página se dibuje: el
  // navegador no encuentra la sección y se queda arriba. Se salta al montar.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, []);

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-control px-2 py-2 text-label font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 ${
      isActive ? 'text-main' : 'text-soft hover:text-main'
    }`;

  return (
    <div className="min-h-screen bg-surface-page text-main">
      <header className="sticky top-0 z-50 border-b border-line bg-surface-page/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="YankoPOS, inicio" className="rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60">
            <Logo />
          </Link>
          <nav aria-label="Documentos legales" className="flex items-center gap-1 sm:gap-3">
            <NavLink to="/terminos" className={tabClass}>Términos</NavLink>
            <NavLink to="/privacidad" className={tabClass}>Privacidad</NavLink>
            <Link to="/" className="hidden items-center gap-1.5 rounded-control px-2 py-2 text-label font-semibold text-soft transition-colors hover:text-main sm:inline-flex">
              <Icon name="arrow-left" size={16} />
              Volver al inicio
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        {/* Índice fijo: solo en escritorio. */}
        <aside className="hidden lg:block">
          <nav aria-label="Secciones" className="sticky top-24">
            <p className="mb-3 text-label font-semibold text-main">En esta página</p>
            <ol className="space-y-0.5 border-l border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                    aria-current={active === s.id ? 'location' : undefined}
                    className={`-ml-px block border-l-2 py-1.5 pl-3 text-label transition-colors ${
                      active === s.id ? 'border-primary-600 font-semibold text-main' : 'border-transparent text-soft hover:text-main'
                    }`}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className="min-w-0 max-w-[720px]">
          <span className="flex h-11 w-11 items-center justify-center rounded-card bg-primary-500/10 text-primary-700 dark:text-primary-400">
            <Icon name={icon} size={22} />
          </span>
          <h1 className="mt-4 font-heading text-title font-bold text-main sm:text-[32px]">{title}</h1>
          <p className="mt-2 text-body text-soft">{summary}</p>
          <p className="mt-1 text-label text-muted">Última actualización: {updatedAt}</p>

          {/* Celular y tablet: saltar a una sección. */}
          <div className="mt-6 lg:hidden">
            <Select aria-label="Ir a la sección" value="" onChange={(e) => e.target.value && goTo(e.target.value)}>
              <option value="">Ir a la sección</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
          </div>

          <div className="mt-10 space-y-10">{children}</div>
        </main>
      </div>

      <footer className="border-t border-line px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-caption text-muted">© {new Date().getFullYear()} YankoPOS. Hecho en Bolivia.</p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link to="/terminos" className="text-caption font-semibold text-muted transition-colors hover:text-main">Términos y condiciones</Link>
            <Link to="/privacidad" className="text-caption font-semibold text-muted transition-colors hover:text-main">Política de privacidad</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Sección con ancla: la unidad de los dos documentos. */
export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="group mb-3 font-heading text-heading font-bold text-main">
        <a href={`#${id}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 rounded-control">
          {title}
        </a>
      </h2>
      <div className="space-y-3 text-body leading-relaxed text-soft">{children}</div>
    </section>
  );
}

/** Párrafo dentro de una sección legal. */
export function LegalP({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

/** Lista con viñetas dentro de una sección legal. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-muted">{children}</ul>;
}

/** Enlace dentro del texto legal (interno con `to`, externo con `href`). */
export function LegalLink({ to, href, children }: { to?: string; href?: string; children: ReactNode }) {
  if (to) return <Link to={to} className={link}>{children}</Link>;
  const external = href?.startsWith('http');
  return (
    <a href={href} className={link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

/** Cómo contactarnos: correo y WhatsApp, igual en los dos documentos. */
export function LegalContact() {
  return (
    <>
      <LegalLink href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</LegalLink> o por WhatsApp al{' '}
      <LegalLink href={LEGAL_WHATSAPP_URL}>{LEGAL_WHATSAPP}</LegalLink>
    </>
  );
}
