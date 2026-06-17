import { Link } from 'react-router-dom';
import type { PlanDto } from '@pos/shared';
import { SaasPlan } from '@pos/shared';
import { usePlans } from '../hooks/usePlans';
import { Spinner } from '../components/ui/Spinner';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/ui/Icon';

/* ─── Paleta — semantic tokens, adapts to theme ─────────── */
const ORG  = 'oklch(0.65 0.22 42)';
const ORGD = 'oklch(0.45 0.22 40)';
const ORGG = 'oklch(0.65 0.22 42 / 0.18)';
const BG   = 'var(--color-surface-page)';
const BG2  = 'var(--color-surface-card)';
const BG3  = 'var(--color-surface-2)';
const BD   = 'var(--border-subtle)';
const BD2  = 'var(--border-strong)';
const CR   = 'var(--color-text-main)';
const CR2  = 'var(--color-text-soft)';
const CR3  = 'var(--color-text-muted)';

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

/* ─── MockPOS ───────────────────────────────────────────── */
function MockPOS() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '580px',
      borderRadius: '16px',
      overflow: 'hidden',
      background: BG2,
      border: `1px solid ${BD}`,
    }}>
      {/* Barra de título */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        borderBottom: `1px solid ${BD}`,
        background: 'oklch(0.12 0.014 40)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['oklch(0.62 0.22 25)','oklch(0.73 0.16 80)','oklch(0.55 0.18 145)'].map((c, i) => (
            <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, margin: '0 12px', borderRadius: 6,
          padding: '3px 12px', textAlign: 'center',
          fontSize: 10, background: BD, color: CR3,
        }}>
          YankoPOS — Punto de Venta
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 180px', height: 272 }}>
        {/* Sidebar */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '14px 0', gap: 10,
          borderRight: `1px solid ${BD}`,
          background: 'oklch(0.09 0.010 38)',
        }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 0 ? ORGG : 'transparent',
              border: i === 0 ? `1px solid oklch(0.65 0.22 42 / 0.35)` : `1px solid transparent`,
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                background: i === 0 ? ORG : 'oklch(0.26 0.016 40)',
              }} />
            </div>
          ))}
        </div>

        {/* Productos */}
        <div style={{ padding: 10, background: BG, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
            {['Populares','Burgers','Bebidas'].map((cat, i) => (
              <div key={cat} style={{
                padding: '3px 9px', borderRadius: 20, fontSize: 9, fontWeight: i === 0 ? 700 : 500,
                background: i === 0 ? ORG : BG3,
                color: i === 0 ? 'white' : CR3,
                border: i !== 0 ? `1px solid ${BD}` : 'none',
              }}>
                {cat}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
            {[
              {name:'Classic Burger',price:'35'},
              {name:'BBQ Bacon',price:'42'},
              {name:'Veggie',price:'30'},
              {name:'Papas Fritas',price:'18'},
              {name:'Onion Rings',price:'20'},
              {name:'Coca-Cola',price:'12'},
            ].map((p, i) => (
              <div key={i} style={{
                borderRadius: 9, padding: 7,
                background: BG2, border: `1px solid ${BD}`,
                cursor: 'pointer',
              }}>
                <div style={{
                  height: 30, borderRadius: 5, marginBottom: 5,
                  background: `oklch(${0.18 + i * 0.016} 0.045 ${42 + i * 6})`,
                }} />
                <p style={{ fontSize: 8, color: CR2, lineHeight: 1.2 }}>{p.name}</p>
                <p style={{ fontSize: 10, color: ORG, fontWeight: 700, marginTop: 2 }}>Bs {p.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de pedido */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${BD}`, background: BG2 }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${BD}` }}>
            <p style={{ fontSize: 9, color: ORG, fontWeight: 700, letterSpacing: '0.08em' }}>PEDIDO #14</p>
            <p style={{ fontSize: 8, color: CR3, marginTop: 2 }}>Mesa · Efectivo</p>
          </div>
          <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[{name:'Classic Burger',qty:2,price:'70'},{name:'BBQ Bacon',qty:1,price:'42'},{name:'Coca-Cola',qty:2,price:'24'}].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 8 }}>
                <div>
                  <p style={{ color: CR }}>{item.name}</p>
                  <p style={{ color: CR3, marginTop: 1 }}>x{item.qty}</p>
                </div>
                <p style={{ color: ORG, fontWeight: 700 }}>Bs {item.price}</p>
              </div>
            ))}
          </div>
          <div style={{ padding: 10, borderTop: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 9 }}>
              <span style={{ color: CR2 }}>Total</span>
              <span style={{ color: CR, fontWeight: 700 }}>Bs 136</span>
            </div>
            <div style={{
              borderRadius: 7, padding: '7px 0', textAlign: 'center',
              fontWeight: 700, fontSize: 9,
              background: ORG, color: 'white',
            }}>
              Confirmar pedido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PlanCard ──────────────────────────────────────────── */
function PlanCard({ plan }: { plan: PlanDto }) {
  const meta     = PLAN_META[plan.id as SaasPlan] ?? PLAN_META[SaasPlan.BASICO];
  const limits   = getLimits(plan);
  const features = getFeatures(plan);
  const usd      = Math.round(plan.priceBs / USD_RATE);

  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      borderRadius: 20,
      padding: '28px 28px 24px',
      background: meta.highlight ? BG3 : BG2,
      border: meta.highlight ? `1.5px solid ${BD2}` : `1px solid ${BD}`,
    }}>
      {meta.highlight && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          padding: '4px 16px', borderRadius: 99,
          fontSize: 11, fontWeight: 800, color: 'white', whiteSpace: 'nowrap',
          background: ORG,
          letterSpacing: '0.04em',
        }}>
          {meta.badge}
        </div>
      )}

      {/* Nombre */}
      <p style={{ fontSize: 11, fontWeight: 700, color: meta.highlight ? ORG : CR3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
        {plan.displayName}
      </p>
      <p style={{ fontSize: 13, color: CR2, lineHeight: 1.5, marginBottom: 20 }}>
        {meta.description}
      </p>

      {/* Precio */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 52, lineHeight: 1, color: meta.highlight ? ORG : CR }}>
            {plan.priceBs}
          </span>
          <div style={{ paddingBottom: 6 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: CR2 }}>Bs</p>
            <p style={{ fontSize: 11, color: CR3 }}>/mes</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: CR3, marginTop: 4 }}>~${usd} USD al cambio referencial</p>
      </div>

      {/* Límites */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20,
        padding: 12, borderRadius: 12,
        background: meta.highlight ? ORGG : BG3,
        border: `1px solid ${meta.highlight ? BD2 : BD}`,
      }}>
        {limits.map((l) => (
          <span key={l} style={{
            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
            background: meta.highlight ? 'oklch(0.65 0.22 42 / 0.25)' : BG2,
            color: meta.highlight ? ORG : CR,
            border: `1px solid ${meta.highlight ? BD2 : BD}`,
          }}>
            {l}
          </span>
        ))}
      </div>

      {/* Features */}
      <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {features.map((f) => (
          <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{
              marginTop: 2, width: 16, height: 16, flexShrink: 0, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: f.included
                ? (meta.highlight ? 'oklch(0.65 0.22 42 / 0.30)' : 'oklch(0.55 0.18 145 / 0.20)')
                : 'oklch(0.18 0.010 40)',
            }}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={f.included ? (meta.highlight ? ORG : 'oklch(0.55 0.18 145)') : CR3} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                {f.included ? <path d="M5 13l4 4L19 7" /> : <path d="M6 18L18 6M6 6l12 12" />}
              </svg>
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.4, color: f.included ? CR2 : CR3 }}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to="/login"
        style={{
          display: 'block', textAlign: 'center',
          padding: '13px 0', borderRadius: 12,
          fontSize: 13, fontWeight: 700,
          transition: 'all 0.15s',
          ...(meta.highlight ? {
            background: ORG, color: 'white',
          } : {
            background: BG3, color: CR2,
            border: `1px solid ${BD2}`,
          }),
        }}
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <Spinner size="md" color="primary" />
    </div>
  );

  if (error || plans.length === 0) return (
    <p style={{ textAlign: 'center', padding: '80px 0', fontSize: 14, color: CR3 }}>
      No se pudieron cargar los planes. Intenta de nuevo más tarde.
    </p>
  );

  const ordered = PLAN_ORDER.map((id) => plans.find((p) => p.id === id)).filter((p): p is PlanDto => p !== undefined);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start', paddingTop: 20 }}>
      {ordered.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
    </div>
  );
}

/* ─── Landing principal ─────────────────────────────────── */
export function LandingPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', background: BG, color: CR, fontFamily: 'var(--font-sans)' }}>

      {/* ── Barra de navegación ──────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${BD}`,
        backdropFilter: 'blur(20px)',
        background: 'oklch(0.10 0.012 38 / 0.92)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 20px',
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: ORG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 18, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)' }}>
              Yanko<span style={{ color: ORG }}>POS</span>
            </span>
          </div>

          {/* Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" className="hidden sm:block" style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              Características
            </a>
            <a href="#pricing" className="hidden sm:block" style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>
              Precios
            </a>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: 8, color: 'rgba(255,255,255,0.50)', display: 'flex', alignItems: 'center' }}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} strokeWidth={1.75} />
            </button>
            <Link to="/login" style={{
              padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: ORG, color: 'white', textDecoration: 'none',
            }}>
              Acceder
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative px-5 sm:px-7 py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Grain texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.40,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '300px 300px',
          mixBlendMode: 'overlay',
        }} />

        {/* Orbe de luz naranja — solo en modo oscuro */}
        {theme === 'dark' && (
          <div style={{
            position: 'absolute', top: -120, left: -80, width: 600, height: 600,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, oklch(0.65 0.22 42 / 0.12) 0%, transparent 70%)',
          }} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          {/* Texto */}
          <div>
            {/* Overline */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: 28, padding: '6px 14px', borderRadius: 99,
              border: `1px solid ${BD2}`, background: ORGG,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORG, display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: ORG, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Software POS · Bolivia
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900,
              fontSize: 'clamp(2.8rem, 6vw, 5.2rem)',
              lineHeight: 1.0, letterSpacing: '-0.03em',
              color: CR, margin: '0 0 24px 0',
            }}>
              Tu restaurante<br />
              en{' '}
              <span style={{ color: ORG }}>
                ritmo<br />de servicio
              </span>
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.65, color: CR2, maxWidth: 420, margin: '0 0 36px 0' }}>
              POS, cocina, caja y reportes. Todo en una sola plataforma diseñada para operar a máxima velocidad.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 44 }}>
              <Link to="/login" style={{
                padding: '14px 28px', borderRadius: 11, fontSize: 14, fontWeight: 700,
                background: ORG, color: 'white', textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}>
                Entrar al panel
              </Link>
              <a href="#pricing" style={{
                padding: '14px 28px', borderRadius: 11, fontSize: 14, fontWeight: 600,
                background: BG3, color: CR2, textDecoration: 'none',
                border: `1px solid ${BD2}`,
              }}>
                Ver planes y precios
              </a>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'flex', gap: 28, borderTop: `1px solid ${BD}`, paddingTop: 28 }}>
              {STATS.slice(0, 2).map((s) => (
                <div key={s.label}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 22, color: ORG, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: CR3, margin: '2px 0 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MockPOS — solo desktop */}
          <div className="hidden lg:flex justify-center items-center">
            <MockPOS />
          </div>
        </div>
      </section>

      {/* ── Banda de stats ───────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, background: BG2 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px', gap: 24 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: ORG, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: CR3, margin: '4px 0 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="px-5 sm:px-7 py-16 sm:py-24">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header de sección */}
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORG, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 14px 0' }}>
              Todo lo que necesitas
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 style={{
                fontFamily: 'var(--font-heading)', fontWeight: 900,
                fontSize: 'clamp(1.9rem, 4vw, 3rem)',
                lineHeight: 1.1, letterSpacing: '-0.025em',
                color: CR, margin: 0, maxWidth: 520,
              }}>
                Una plataforma completa,<br />nada de extras innecesarios
              </h2>
              <p style={{ fontSize: 14, color: CR3, maxWidth: 280, margin: 0, lineHeight: 1.6 }}>
                Todo lo que un restaurante necesita para operar bien desde el primer día.
              </p>
            </div>
          </div>

          {/* Lista numerada editorial */}
          <div>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="grid grid-cols-[40px_1fr] md:grid-cols-[80px_1fr_1fr] gap-x-4 md:gap-x-10 gap-y-2 md:gap-y-0 items-center"
                style={{
                  padding: '28px 0',
                  borderTop: `1px solid ${BD}`,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = BG2; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Número grande */}
                <div style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 900,
                  fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1, color: ORGG,
                  letterSpacing: '-0.04em', userSelect: 'none',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* Título + ícono */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ORGG, border: `1px solid ${BD2}`,
                  }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={ORG} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      {f.icon}
                    </svg>
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 800,
                    fontSize: 17, color: CR, margin: 0, letterSpacing: '-0.02em',
                  }}>
                    {f.title}
                  </h3>
                </div>

                {/* Descripción */}
                <p className="col-start-2 md:col-auto" style={{ fontSize: 14, color: CR2, lineHeight: 1.65, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${BD}` }} />
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="px-5 sm:px-7 py-16 sm:py-24" style={{ background: BG2, borderTop: `1px solid ${BD}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ORG, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 14px 0' }}>
              Planes y precios
            </p>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900,
              fontSize: 'clamp(1.9rem, 4vw, 3rem)',
              lineHeight: 1.1, letterSpacing: '-0.025em',
              color: CR, margin: '0 0 14px 0',
            }}>
              Paga solo lo que necesitas
            </h2>
            <p style={{ fontSize: 15, color: CR3, maxWidth: 420, margin: '0 auto' }}>
              Precios en bolivianos, sin contratos ni sorpresas. Cancela cuando quieras.
            </p>
          </div>

          <PricingSection />

          <p style={{ textAlign: 'center', fontSize: 11, color: CR3, marginTop: 36 }}>
            Tipo de cambio referencial: 1 USD = {USD_RATE} Bs. Los precios pueden ajustarse según variación del tipo de cambio
          </p>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────── */}
      <section className="px-5 sm:px-7 py-16 sm:py-24 relative overflow-hidden" style={{ background: ORGD }}>
        {/* Grain */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.20,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.25'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat', backgroundSize: '200px 200px',
          mixBlendMode: 'multiply',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900,
            fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
            lineHeight: 1.0, letterSpacing: '-0.03em',
            color: 'white', margin: '0 0 20px 0',
          }}>
            ¿Listo para empezar?
          </h2>
          <p style={{ fontSize: 16, color: 'oklch(0.90 0.04 55)', maxWidth: 380, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Accede a tu panel y empieza a gestionar tu restaurante hoy mismo.
          </p>
          <Link to="/login" style={{
            display: 'inline-block',
            padding: '16px 36px', borderRadius: 12,
            fontSize: 15, fontWeight: 800,
            background: 'white', color: ORGD,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}>
            Acceder al panel
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BD}`, padding: '24px 20px', background: BG }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: ORG, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: CR2 }}>YankoPOS</span>
          </div>

          <nav style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Características', href: '#features' },
              { label: 'Precios', href: '#pricing' },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ fontSize: 12, color: CR3, textDecoration: 'none' }}>{l.label}</a>
            ))}
            <Link to="/login" style={{ fontSize: 12, color: CR3, textDecoration: 'none' }}>Acceder</Link>
          </nav>

          <p style={{ fontSize: 12, color: CR3 }}>
            © {new Date().getFullYear()} YankoPOS · Hecho en Bolivia 🇧🇴
          </p>
        </div>
      </footer>
    </div>
  );
}
