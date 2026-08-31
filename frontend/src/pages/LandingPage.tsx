import { Link } from 'react-router-dom';
import type { PlanDto } from '@pos/shared';
import { SaasPlan } from '@pos/shared';
import { usePlans } from '../hooks/usePlans';
import { Spinner } from '../components/ui/Spinner';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/ui/Icon';
import landingPosImage from '../assets/landing-pos.jpg';

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />,
    title: 'POS Fluido',
    desc: 'Toma pedidos y cobra en segundos. Pagos mixtos, múltiples métodos, sin fricciones.',
  },
  {
    icon: <path d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />,
    title: 'Cocina en Tiempo Real',
    desc: 'Los pedidos llegan al display de cocina al instante vía WebSocket. Sin tickets de papel.',
  },
  {
    icon: <path d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />,
    title: 'Caja Controlada',
    desc: 'Apertura y cierre con arqueos automáticos. Registra gastos y detecta diferencias.',
  },
  {
    icon: <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />,
    title: 'Reportes Detallados',
    desc: 'Ventas por período, productos más vendidos, métodos de pago. Todo en un panel limpio.',
  },
  {
    icon: <path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />,
    title: 'Multi-sucursal',
    desc: 'Gestiona varias sucursales desde una sola cuenta. Equipos independientes, visión unificada.',
  },
  {
    icon: <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
    title: 'Clientes y Fidelización',
    desc: 'Historial de pedidos, registro de clientes y sorteos. Relaciones duraderas, no solo ventas.',
  },
];

const STATS = [
  { value: '< 3s',       label: 'para crear un pedido' },
  { value: '100%',       label: 'en la nube, sin instalación' },
  { value: '24/7',       label: 'disponibilidad garantizada' },
  { value: 'Tiempo real',label: 'actualizaciones en vivo' },
];

const USD_RATE = 9;

type PlanMeta = { description: string; highlight: boolean; badge?: string; cta: string };

const PLAN_META: Record<SaasPlan, PlanMeta> = {
  [SaasPlan.BASICO]:  { description: 'Todo lo esencial para un restaurante que arranca.', highlight: false, cta: 'Empezar con Básico' },
  [SaasPlan.PRO]:     { description: 'Para restaurantes en operación que quieren escalar.', highlight: true, badge: 'Más popular', cta: 'Empezar con Pro' },
  [SaasPlan.NEGOCIO]: { description: 'Para cadenas y franquicias con múltiples locales.', highlight: false, cta: 'Contactar' },
};

const PLAN_ORDER: SaasPlan[] = [SaasPlan.BASICO, SaasPlan.PRO, SaasPlan.NEGOCIO];

function getLimits(plan: PlanDto): string[] {
  return [
    plan.maxBranches >= 999 ? 'sucursales ilimitadas' : `${plan.maxBranches} sucursal${plan.maxBranches > 1 ? 'es' : ''}`,
    plan.maxCashiers >= 999 ? 'cajeros ilimitados'    : `${plan.maxCashiers} cajero${plan.maxCashiers > 1 ? 's' : ''}`,
    plan.maxProducts >= 999 ? 'productos ilimitados'  : `hasta ${plan.maxProducts} productos`,
  ];
}

function getFeatures(plan: PlanDto): { text: string; included: boolean }[] {
  if (plan.id === SaasPlan.BASICO) return [
    { text: 'POS + pagos mixtos',                included: true },
    { text: 'Pedidos con estados y seguimiento', included: true },
    { text: 'Gestión de caja y gastos',          included: true },
    { text: 'Clientes y fidelización',           included: true },
    { text: 'Reportes de ventas',                included: true },
    { text: 'Display de cocina en tiempo real',  included: plan.kitchenEnabled },
    { text: 'Sorteos para clientes',             included: plan.rafflesEnabled },
    { text: 'Múltiples sucursales',              included: plan.maxBranches > 1 },
  ];
  if (plan.id === SaasPlan.PRO) return [
    { text: 'Todo lo del plan Básico',           included: true },
    { text: 'Display de cocina en tiempo real',  included: plan.kitchenEnabled },
    { text: 'Sorteos para clientes',             included: plan.rafflesEnabled },
    { text: `Hasta ${plan.maxBranches} sucursales`, included: true },
    { text: `Hasta ${plan.maxCashiers} cajeros`, included: true },
    { text: 'Productos ilimitados',              included: plan.maxProducts >= 999 },
    { text: 'Sucursales ilimitadas',             included: plan.maxBranches >= 999 },
    { text: 'Cajeros ilimitados',                included: plan.maxCashiers >= 999 },
  ];
  return [
    { text: 'Todo lo del plan Pro',  included: true },
    { text: 'Sucursales ilimitadas', included: plan.maxBranches >= 999 },
    { text: 'Cajeros ilimitados',    included: plan.maxCashiers >= 999 },
    { text: 'Sin límite de escala',  included: true },
  ];
}

/* ─── PlanCard ──────────────────────────────────────────── */
function PlanCard({ plan }: { plan: PlanDto }) {
  const meta     = PLAN_META[plan.id as SaasPlan] ?? PLAN_META[SaasPlan.BASICO];
  const limits   = getLimits(plan);
  const features = getFeatures(plan);
  const usd      = Math.round(plan.priceBs / USD_RATE);

  return (
    <div className={`relative flex flex-col rounded-[20px] p-7 transition-all duration-300 hover:-translate-y-1 ${
      meta.highlight 
        ? 'bg-[var(--color-surface-3)] border-[1.5px] border-[var(--border-strong)] shadow-card-xl' 
        : 'bg-[var(--color-surface-card)] border border-[var(--border-subtle)] shadow-card-lg'
    }`}>
      {meta.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black text-white whitespace-nowrap tracking-wide bg-primary-500 shadow-[0_4px_12px_oklch(0.65_0.22_42/0.4)]">
          {meta.badge}
        </div>
      )}

      {/* Nombre */}
      <p className={`text-[11px] font-bold tracking-[0.12em] uppercase mb-2 ${meta.highlight ? 'text-primary-500' : 'text-[var(--color-text-muted)]'}`}>
        {plan.displayName}
      </p>
      <p className="text-[13px] text-[var(--color-text-soft)] leading-relaxed mb-5">
        {meta.description}
      </p>

      {/* Precio */}
      <div className="mb-5">
        <div className="flex items-end gap-1.5">
          <span className={`font-heading font-black text-5xl leading-none ${meta.highlight ? 'text-primary-500' : 'text-[var(--color-text-main)]'}`}>
            {plan.priceBs}
          </span>
          <div className="pb-1">
            <p className="text-sm font-bold text-[var(--color-text-soft)]">Bs</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">/mes</p>
          </div>
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5">~${usd} USD al cambio referencial</p>
      </div>

      {/* Límites */}
      <div className={`flex flex-wrap gap-1.5 mb-5 p-3 rounded-xl ${
        meta.highlight ? 'bg-primary-500/15 border border-primary-500/30' : 'bg-[var(--color-surface-3)] border border-[var(--border-subtle)]'
      }`}>
        {limits.map((l) => (
          <span key={l} className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
            meta.highlight 
              ? 'bg-primary-500/20 text-primary-600 border border-primary-500/30' 
              : 'bg-[var(--color-surface-card)] text-[var(--color-text-main)] border border-[var(--border-subtle)]'
          }`}>
            {l}
          </span>
        ))}
      </div>

      {/* Features */}
      <ul className="flex-1 flex flex-col gap-2.5 mb-6">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center ${
              f.included
                ? (meta.highlight ? 'bg-primary-500/20' : 'bg-emerald-500/20')
                : 'bg-[var(--color-surface-3)]'
            }`}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={f.included ? (meta.highlight ? 'oklch(0.65 0.22 42)' : 'oklch(0.55 0.18 145)') : 'var(--color-text-muted)'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                {f.included ? <path d="M5 13l4 4L19 7" /> : <path d="M6 18L18 6M6 6l12 12" />}
              </svg>
            </span>
            <span className={`text-[13px] leading-snug ${f.included ? 'text-[var(--color-text-soft)]' : 'text-[var(--color-text-muted)]'}`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to="/login"
        className={`block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200 active:scale-[0.98] ${
          meta.highlight 
            ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-[0_4px_14px_oklch(0.65_0.22_42/0.3)]' 
            : 'bg-[var(--color-surface-3)] text-[var(--color-text-soft)] border border-[var(--border-strong)] hover:bg-[var(--color-surface-card)]'
        }`}
      >
        {meta.cta}
      </Link>
    </div>
  );
}

/* ─── PricingSection ────────────────────────────────────── */
function PricingSection() {
  const { plans, loading, error } = usePlans();

  if (loading) return (
    <div className="flex justify-center py-20">
      <Spinner size="md" color="primary" />
    </div>
  );

  if (error || plans.length === 0) return (
    <p className="text-center py-20 text-sm text-[var(--color-text-muted)]">
      No se pudieron cargar los planes. Intenta de nuevo más tarde.
    </p>
  );

  const ordered = PLAN_ORDER.map((id) => plans.find((p) => p.id === id)).filter((p): p is PlanDto => p !== undefined);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start pt-5">
      {ordered.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
    </div>
  );
}

/* ─── Landing principal ─────────────────────────────────── */
export function LandingPage() {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-surface-page)] text-[var(--color-text-main)] selection:bg-primary-500/30">
      
      {/* ── Barra de navegación ──────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--color-surface-page)]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--color-surface-page)]/60 transition-colors">
        <div className="max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <span className="font-heading font-black text-lg tracking-tight text-[var(--color-text-main)]">
              Yanko<span className="text-primary-500">POS</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#features" className="hidden sm:block text-[13px] font-semibold text-[var(--color-text-soft)] hover:text-[var(--color-text-main)] transition-colors">
              Características
            </a>
            <a href="#pricing" className="hidden sm:block text-[13px] font-semibold text-[var(--color-text-soft)] hover:text-[var(--color-text-main)] transition-colors">
              Precios
            </a>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-all"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} strokeWidth={2} />
            </button>
            <Link to="/login" className="px-4 py-2 rounded-xl text-[13px] font-bold bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm">
              Acceder
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative px-5 py-8 sm:py-12 lg:py-16 overflow-hidden">
        {/* Orbe de luz naranja decorativo */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none bg-primary-500/5 translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          
          {/* Texto */}
          <div className="max-w-[540px] mx-auto lg:mx-0 text-center lg:text-left z-10 animate-fade">
            <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-dot" />
              <span className="text-[11px] font-bold text-primary-600 tracking-wider uppercase">
                Software POS · Bolivia
              </span>
            </div>

            <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-[var(--color-text-main)] mb-6 drop-shadow-sm">
              Tu restaurante<br className="hidden sm:block" />
              {' '}en{' '}
              <span className="text-primary-500 bg-gradient-to-r from-primary-500 to-orange-400 bg-clip-text text-transparent">
                ritmo de servicio
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-text-soft)] leading-relaxed mb-10 mx-auto lg:mx-0 max-w-[460px]">
              Toma pedidos, envía a cocina y cobra al instante. Todo en una sola plataforma diseñada para operar a máxima velocidad.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 mb-12">
              <Link to="/login" className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-[14px] font-bold bg-primary-500 text-white hover:bg-primary-600 transition-all active:scale-[0.98] shadow-[0_4px_16px_oklch(0.65_0.22_42/0.25)] hover:shadow-[0_6px_20px_oklch(0.65_0.22_42/0.35)] text-center">
                Entrar al panel
              </Link>
              <a href="#pricing" className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-[14px] font-bold bg-[var(--color-surface-2)] text-[var(--color-text-main)] border border-[var(--border-strong)] hover:bg-[var(--color-surface-3)] transition-all active:scale-[0.98] text-center">
                Ver planes y precios
              </a>
            </div>
          </div>

          {/* Imagen principal (Humana, realista) */}
          <div className="relative animate-slide lg:block w-full max-w-[600px] mx-auto z-10">
            {/* Decoración detrás de la imagen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent rounded-[32px] transform translate-x-4 translate-y-4 blur-sm" />
            
            <div className="relative rounded-[32px] overflow-hidden border border-[var(--border-subtle)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-[var(--color-surface-card)]">
              {/* Imagen local: se incluye en el build y no depende de un host externo. */}
              <img 
                src={landingPosImage}
                alt="Terminal POS" 
                className="w-full h-auto aspect-[4/3] object-cover"
              />
              {/* Capa de brillo superior (Glassmorphism sutil) */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[32px] pointer-events-none" />
              
              {/* Etiqueta flotante decorativa */}
              <div className="absolute bottom-6 left-6 right-6 sm:left-8 sm:right-auto bg-[var(--color-surface-card)]/90 backdrop-blur-md border border-[var(--border-subtle)] p-4 rounded-2xl shadow-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Icon name="check" size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text-main)]">Pedido completado</p>
                  <p className="text-xs font-medium text-[var(--color-text-muted)] mt-0.5">Cobro en efectivo procesado</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── Banda de stats ───────────────────────────────── */}
      <div className="border-y border-[var(--border-subtle)] bg-[var(--color-surface-2)]">
        <div className="max-w-[1200px] mx-auto px-5 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center group">
                <p className="font-heading font-black text-3xl sm:text-4xl text-primary-500 mb-1 group-hover:scale-105 transition-transform">{s.value}</p>
                <p className="text-[13px] font-semibold text-[var(--color-text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="px-5 py-20 sm:py-32">
        <div className="max-w-[1200px] mx-auto">
          {/* Header de sección */}
          <div className="mb-16 md:mb-24 text-center sm:text-left">
            <p className="text-[12px] font-bold text-primary-500 tracking-[0.16em] uppercase mb-4">
              Todo lo que necesitas
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <h2 className="font-heading font-black text-4xl sm:text-5xl leading-tight tracking-tight text-[var(--color-text-main)] max-w-[600px]">
                Una plataforma completa,<br />nada de extras innecesarios
              </h2>
              <p className="text-base text-[var(--color-text-soft)] max-w-[320px] mx-auto sm:mx-0 leading-relaxed">
                Herramientas diseñadas para que operes de forma rápida, reduzcas errores y conozcas tus márgenes reales.
              </p>
            </div>
          </div>

          {/* Grid de features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl bg-[var(--color-surface-card)] border border-[var(--border-subtle)] shadow-card-md hover:shadow-card-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary-500/10 border border-primary-500/20 mb-6 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300 text-primary-500">
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-[var(--color-text-main)] mb-3 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-[14.5px] text-[var(--color-text-soft)] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="px-5 py-20 sm:py-32 bg-[var(--color-surface-2)] border-t border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] font-bold text-primary-500 tracking-[0.16em] uppercase mb-4">
              Planes y precios
            </p>
            <h2 className="font-heading font-black text-4xl sm:text-5xl leading-tight tracking-tight text-[var(--color-text-main)] mb-5">
              Paga solo lo que necesitas
            </h2>
            <p className="text-base text-[var(--color-text-soft)] max-w-[480px] mx-auto">
              Precios transparentes en bolivianos, sin contratos ocultos ni comisiones por transacción. Cancela cuando quieras.
            </p>
          </div>

          <PricingSection />

          <p className="text-center text-xs font-medium text-[var(--color-text-muted)] mt-12 max-w-xl mx-auto">
            Tipo de cambio referencial: 1 USD = {USD_RATE} Bs. Los precios en bolivianos pueden estar sujetos a ajustes según la variación del tipo de cambio.
          </p>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────── */}
      <section className="relative px-5 py-24 sm:py-32 overflow-hidden bg-primary-600">
        {/* Grain effect overlay */}
        <div className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="font-heading font-black text-4xl sm:text-6xl text-white tracking-tight mb-6 drop-shadow-sm">
            ¿Listo para modernizar tu negocio?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 max-w-[500px] mx-auto mb-10 leading-relaxed">
            Únete a los restaurantes que ya están operando con YankoPOS. Configuración en minutos.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-[15px] font-bold bg-white text-primary-600 hover:bg-gray-50 transition-all active:scale-[0.98] shadow-xl hover:shadow-2xl">
            Acceder al panel ahora
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--color-surface-page)] py-10 px-5">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary-500 flex items-center justify-center">
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218" />
              </svg>
            </div>
            <span className="font-heading font-bold text-sm text-[var(--color-text-main)]">YankoPOS</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-primary-500 transition-colors">Características</a>
            <a href="#pricing" className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-primary-500 transition-colors">Precios</a>
            <Link to="/login" className="text-xs font-semibold text-[var(--color-text-muted)] hover:text-primary-500 transition-colors">Acceder</Link>
          </nav>

          <p className="text-xs font-medium text-[var(--color-text-muted)] text-center sm:text-right">
            © {new Date().getFullYear()} YankoPOS · Hecho en Bolivia 🇧🇴
          </p>
        </div>
      </footer>
    </div>
  );
}
