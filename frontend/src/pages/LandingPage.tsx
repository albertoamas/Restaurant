import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isUnlimited, SaasPlan, type PlanDto } from '@pos/shared';
import { usePlans } from '../hooks/usePlans';
import { buttonClasses } from '../components/ui/Button';
import { Icon, type IconName } from '../components/ui/Icon';
import { Skeleton } from '../components/ui/Skeleton';
import landingPosImage from '../assets/landing-pos.jpg';
import { BrandLogo } from '../components/ui/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, whatsappUrl } from '../contact';

const DEMO_MESSAGE = 'Hola, quiero una demo de YankoPOS para mi negocio.';

/* ─── Contenido ─────────────────────────────────────────── */

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'cart',     title: 'Punto de venta',   desc: 'Toma pedidos y cobra en pocos toques. Efectivo, QR o tarjeta, y pagos divididos.' },
  { icon: 'flame',    title: 'Cocina conectada', desc: 'Los pedidos aparecen en la pantalla de cocina apenas se confirman. Sin comandas perdidas.' },
  { icon: 'cash',     title: 'Caja y gastos',    desc: 'Abre y cierra caja con el efectivo esperado a la vista. Registra gastos y compras del día.' },
  { icon: 'chart',    title: 'Reportes',         desc: 'Ventas por día y por hora, productos más vendidos y ganancia después de gastos.' },
  { icon: 'building', title: 'Varias sucursales', desc: 'Cada sucursal con su caja y sus cajeros. Tú ves todo junto o por separado.' },
  { icon: 'gift',     title: 'Clientes y sorteos', desc: 'Historial de cada cliente y sorteos para premiar a los que vuelven.' },
];

const FACTS: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'download', title: 'Sin instalar nada',         desc: 'Funciona en el navegador' },
  { icon: 'maximize', title: 'Tablet, PC o celular',      desc: 'Y se instala como app' },
  { icon: 'refresh',  title: 'Cocina y caja al instante', desc: 'Todo se actualiza solo' },
  { icon: 'dollar',   title: 'Precios en bolivianos',     desc: 'Sin comisión por venta' },
];

const USD_RATE = 9;

type PlanMeta = { description: string; highlight: boolean };

const PLAN_META: Record<SaasPlan, PlanMeta> = {
  [SaasPlan.BASICO]:  { description: 'Para un local que empieza.', highlight: false },
  [SaasPlan.PRO]:     { description: 'Para un negocio con cocina y más de un cajero.', highlight: true },
  [SaasPlan.NEGOCIO]: { description: 'Para cadenas con varias sucursales.', highlight: false },
};

const PLAN_ORDER: SaasPlan[] = [SaasPlan.BASICO, SaasPlan.PRO, SaasPlan.NEGOCIO];

/** Lo que todos los planes incluyen: va una sola vez, no repetido en cada tarjeta. */
const COMMON = 'Punto de venta, pedidos, caja y gastos, clientes y equipo.';

/** `-1` es "sin límite" en la BD. */
function limit(value: number, singular: string, plural: string, unlimited: string): string {
  if (isUnlimited(value)) return unlimited;
  return `${value} ${value === 1 ? singular : plural}`;
}

/** Lo que cambia entre planes, desde sus valores reales (cambiar un límite en /admin se ve aquí). */
function planLines(plan: PlanDto): { text: string; included: boolean }[] {
  return [
    { text: limit(plan.maxBranches, 'sucursal', 'sucursales', 'Sucursales ilimitadas'), included: true },
    { text: limit(plan.maxCashiers, 'cajero', 'cajeros', 'Cajeros ilimitados'), included: true },
    { text: isUnlimited(plan.maxProducts) ? 'Productos ilimitados' : `Hasta ${plan.maxProducts} productos`, included: true },
    // Solo se anuncia lo que el servidor hace cumplir de verdad.
    { text: 'Pantalla de cocina', included: plan.kitchenEnabled },
    { text: 'Sorteos para clientes', included: plan.rafflesEnabled },
    { text: 'Reportes avanzados', included: plan.advancedReports },
    {
      text: isUnlimited(plan.reportHistoryDays) ? 'Historial de reportes completo' : `Reportes de los últimos ${plan.reportHistoryDays} días`,
      included: true,
    },
    {
      text: isUnlimited(plan.maxStorageMb)
        ? 'Fotos de productos sin límite'
        : `${plan.maxStorageMb >= 1024 ? `${Math.round(plan.maxStorageMb / 1024)} GB` : `${plan.maxStorageMb} MB`} para fotos`,
      included: true,
    },
  ];
}

/* ─── Piezas ────────────────────────────────────────────── */


function SectionTitle({ eyebrow, title, desc, center = false }: { eyebrow: string; title: string; desc?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-label font-semibold text-primary-700 dark:text-primary-400">{eyebrow}</p>
      <h2 className="mt-2 font-heading text-[32px] font-bold leading-tight text-main sm:text-[40px]">{title}</h2>
      {desc && <p className="mt-3 text-body text-soft sm:text-[17px]">{desc}</p>}
    </div>
  );
}

function ExternalButton({ href, children, variant = 'primary', size = 'lg', className = '' }: {
  href: string; children: ReactNode; variant?: 'primary' | 'secondary'; size?: 'md' | 'lg'; className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant, size, className })}>
      {children}
    </a>
  );
}

function PlanCard({ plan }: { plan: PlanDto }) {
  const meta = PLAN_META[plan.id as SaasPlan] ?? PLAN_META[SaasPlan.BASICO];
  const usd  = Math.round(plan.priceBs / USD_RATE);

  return (
    <article className={`relative flex flex-col rounded-card border bg-surface-card p-6 sm:p-7 ${
      meta.highlight ? 'border-primary-600 shadow-floating ring-1 ring-primary-600' : 'border-line shadow-raised'
    }`}>
      {meta.highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary-600 px-3 py-1 text-caption font-semibold text-white shadow-raised">
          El más elegido
        </span>
      )}

      <h3 className="font-heading text-heading font-bold text-main">{plan.displayName}</h3>
      <p className="mt-1 text-label text-soft">{meta.description}</p>

      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="font-heading text-[44px] font-bold leading-none text-main tabular-nums">{plan.priceBs}</span>
        <span className="text-body font-semibold text-soft">Bs al mes</span>
      </p>
      <p className="mt-1 text-caption text-muted">Unos {usd} USD al cambio referencial</p>

      <ul className="mt-6 flex-1 space-y-2.5 border-t border-line pt-5">
        {planLines(plan).map((l) => (
          <li key={l.text} className={`flex items-start gap-2.5 text-label ${l.included ? 'text-main' : 'text-muted'}`}>
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              l.included ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-surface-2 text-muted'
            }`}>
              <Icon name={l.included ? 'check' : 'minus'} size={12} strokeWidth={3} />
            </span>
            <span className={l.included ? '' : 'line-through decoration-muted/60'}>
              {l.text}
              {!l.included && <span className="sr-only"> (no incluido)</span>}
            </span>
          </li>
        ))}
      </ul>

      <ExternalButton
        href={whatsappUrl(`Hola, me interesa el plan ${plan.displayName} de YankoPOS.`)}
        variant={meta.highlight ? 'primary' : 'secondary'}
        className="mt-6 w-full"
      >
        <Icon name="chat" size={18} />
        Quiero el plan {plan.displayName}
      </ExternalButton>
    </article>
  );
}

function PricingSection() {
  const { plans, loading, error } = usePlans();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLAN_ORDER.map((id) => <Skeleton key={id} variant="rect" h="520px" />)}
      </div>
    );
  }
  if (error || plans.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface-card px-6 py-10 text-center">
        <p className="text-body text-soft">No se pudieron cargar los planes.</p>
        <ExternalButton href={whatsappUrl('Hola, quiero conocer los planes de YankoPOS.')} variant="secondary" size="md" className="mt-4">
          Pregúntanos por WhatsApp
        </ExternalButton>
      </div>
    );
  }

  const ordered = PLAN_ORDER.map((id) => plans.find((p) => p.id === id)).filter((p): p is PlanDto => p !== undefined);
  return (
    <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-3 md:gap-5 lg:gap-6">
      {ordered.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
    </div>
  );
}

const navLink = 'rounded-control px-2 py-2 text-label font-semibold text-soft transition-colors hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60';
const footerLink = 'text-label text-soft transition-colors hover:text-main';

/* ─── Página ────────────────────────────────────────────── */

export function LandingPage() {

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface-page text-main selection:bg-primary-500/30">
      <header className="sticky top-0 z-50 border-b border-line bg-surface-page/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="YankoPOS, inicio" className="rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60">
            <BrandLogo />
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-3">
            <a href="#features" className={`${navLink} hidden md:inline-flex`}>Características</a>
            <a href="#pricing" className={navLink}>Precios</a>
            <ThemeToggle />
            <Link to="/login" className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'whitespace-nowrap' })}>
              <span className="sm:hidden">Entrar</span>
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:pb-20 lg:pt-20">
        <div aria-hidden className="pointer-events-none absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary-500/10 blur-[110px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 h-[460px] w-[460px] rounded-full bg-primary-500/5 blur-[100px]" />

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="mx-auto max-w-[560px] text-center lg:mx-0 lg:text-left animate-fade">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-label font-semibold text-primary-700 dark:text-primary-400">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" aria-hidden />
              Para restaurantes, cafeterías y comida rápida
            </p>
            <h1 className="mt-5 font-heading text-[44px] font-bold leading-[1.05] tracking-tight text-main sm:text-[56px] lg:text-[64px]">
              Vende, cocina y cobra <span className="text-primary-600 dark:text-primary-400">sin papeles</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[480px] text-[17px] leading-relaxed text-soft lg:mx-0">
              Pedidos, cocina, caja y reportes de tu negocio en un solo lugar. Desde la tablet, la computadora o el celular.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <ExternalButton href={whatsappUrl(DEMO_MESSAGE)}>
                <Icon name="chat" size={18} />
                Pedir una demo
              </ExternalButton>
              <a href="#pricing" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>Ver planes</a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] animate-slide">
            <div className="relative overflow-hidden rounded-dialog border border-line bg-surface-card shadow-overlay">
              <img src={landingPosImage} alt="Cajera cobrando un pedido en una tablet" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute right-4 top-4 hidden items-center gap-2 rounded-control border border-line bg-surface-card/90 px-3 py-2 shadow-floating backdrop-blur-md sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                <p className="text-label font-semibold text-main">Cocina conectada</p>
              </div>
              <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-card border border-line bg-surface-card/90 p-3 shadow-floating backdrop-blur-md sm:right-auto">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <Icon name="check" size={18} strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-label font-semibold text-main">Pedido 24 cobrado</p>
                  <p className="text-caption text-muted">Efectivo, Bs 85.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hechos */}
      <div className="border-y border-line bg-surface-2">
        <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-4 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {FACTS.map((f) => (
            <li key={f.title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-500/10 text-primary-700 dark:text-primary-400">
                <Icon name={f.icon} size={18} />
              </span>
              <span>
                <span className="block text-body font-semibold text-main">{f.title}</span>
                <span className="block text-caption text-muted">{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Características */}
      <section id="features" className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionTitle
            eyebrow="Todo lo que necesitas"
            title="Lo que pasa en tu negocio, en una sola pantalla"
            desc="Menos papel y menos errores: cada pedido va de la caja a la cocina y termina en tus reportes."
          />
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-card border border-line bg-surface-card p-6 shadow-raised">
                <span className="flex h-11 w-11 items-center justify-center rounded-control bg-primary-500/10 text-primary-700 dark:text-primary-400">
                  <Icon name={f.icon} size={22} />
                </span>
                <h3 className="mt-4 font-heading text-heading font-bold text-main">{f.title}</h3>
                <p className="mt-1.5 text-body text-soft">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Planes */}
      <section id="pricing" className="scroll-mt-16 border-t border-line bg-surface-2 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1200px]">
          <SectionTitle
            center
            eyebrow="Planes y precios"
            title="Paga solo lo que necesitas"
            desc="Precios en bolivianos, sin comisión por venta y sin contratos largos."
          />
          <p className="mx-auto mb-8 mt-6 flex max-w-2xl items-start justify-center gap-2 text-center text-label text-soft">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span><span className="font-semibold text-main">Todos los planes incluyen:</span> {COMMON}</span>
          </p>
          <PricingSection />
        </div>
      </section>

      {/* Llamado final: tarjeta sobria con un brillo de marca, como el resto de la página. */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative mx-auto max-w-[960px] overflow-hidden rounded-dialog border border-line bg-surface-card px-6 py-12 text-center shadow-raised sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-primary-500/15 blur-[90px]" />
          <div className="relative">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-primary-500/10 text-primary-700 dark:text-primary-400">
              <Icon name="chat" size={24} />
            </span>
            <h2 className="mt-5 font-heading text-[28px] font-bold leading-tight text-main sm:text-[40px]">
              ¿Lo vemos funcionando en tu negocio?
            </h2>
            <p className="mx-auto mt-3 max-w-[520px] text-body text-soft sm:text-[17px]">
              Escríbenos por WhatsApp: te mostramos YankoPOS con tus productos y te ayudamos a empezar.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <ExternalButton href={whatsappUrl(DEMO_MESSAGE)}>
                <Icon name="chat" size={18} />
                Pedir una demo
              </ExternalButton>
              <a href="#pricing" className={buttonClasses({ variant: 'secondary', size: 'lg' })}>Ver planes</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surface-page px-4 pb-8 pt-14 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:grid-cols-12">
            <div className="col-span-2 sm:col-span-4 lg:col-span-5">
              <BrandLogo />
              <p className="mt-4 max-w-[320px] text-label text-muted">
                Sistema de ventas para restaurantes y negocios de comida de Bolivia. Pedidos, cocina, caja y reportes en un solo lugar.
              </p>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-3 text-label font-semibold text-main">Producto</p>
              <ul className="space-y-2.5">
                <li><a href="#features" className={footerLink}>Características</a></li>
                <li><a href="#pricing" className={footerLink}>Precios</a></li>
                <li><Link to="/login" className={footerLink}>Iniciar sesión</Link></li>
              </ul>
            </div>
            <div className="lg:col-span-2">
              <p className="mb-3 text-label font-semibold text-main">Legal</p>
              <ul className="space-y-2.5">
                <li><Link to="/terminos" className={footerLink}>Términos y condiciones</Link></li>
                <li><Link to="/privacidad" className={footerLink}>Política de privacidad</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-4 lg:col-span-3">
              <p className="mb-3 text-label font-semibold text-main">Contacto</p>
              <ul className="space-y-2.5">
                <li>
                  <a href={whatsappUrl(DEMO_MESSAGE)} target="_blank" rel="noopener noreferrer" className={footerLink}>
                    WhatsApp: {WHATSAPP_DISPLAY}
                  </a>
                </li>
                <li><a href={`mailto:${CONTACT_EMAIL}`} className={footerLink}>{CONTACT_EMAIL}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-line pt-6 sm:flex-row">
            <p className="text-caption text-muted">© {new Date().getFullYear()} YankoPOS. Hecho en Bolivia.</p>
            <p className="text-caption text-muted">Alberto Amas Villarroel</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
