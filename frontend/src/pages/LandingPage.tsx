import { Link } from 'react-router-dom';

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
  { value: '< 3s', label: 'para crear un pedido' },
  { value: '100%', label: 'en la nube, sin instalación' },
  { value: '24/7', label: 'disponibilidad garantizada' },
  { value: 'Multi', label: 'sucursal desde el día uno' },
];

type PlanFeature = { text: string; included: boolean };

type Plan = {
  name: string;
  price: number;
  usd: number;
  description: string;
  highlight: boolean;
  badge?: string;
  limits: string[];
  features: PlanFeature[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    name: 'Básico',
    price: 220,
    usd: 24,
    description: 'Todo lo esencial para un restaurante que arranca.',
    highlight: false,
    limits: ['1 sucursal', '2 cajeros', 'hasta 80 productos'],
    features: [
      { text: 'POS + pagos mixtos',        included: true },
      { text: 'Gestión de caja y gastos',  included: true },
      { text: 'Clientes y fidelización',   included: true },
      { text: 'Reportes básicos',          included: true },
      { text: 'Display de cocina',         included: false },
      { text: 'Exportación PDF',           included: false },
      { text: 'Descuentos en pedidos',     included: false },
      { text: 'Gestión de mesas',          included: false },
    ],
    cta: 'Empezar con Básico',
  },
  {
    name: 'Pro',
    price: 399,
    usd: 44,
    description: 'Para restaurantes en operación que quieren escalar.',
    highlight: true,
    badge: 'Más popular',
    limits: ['3 sucursales', '8 cajeros', 'productos ilimitados'],
    features: [
      { text: 'Todo lo del plan Básico',   included: true },
      { text: 'Display de cocina',         included: true },
      { text: 'Exportación PDF',           included: true },
      { text: 'Descuentos en pedidos',     included: true },
      { text: 'Gestión de mesas',          included: true },
      { text: 'Control de inventario',     included: false },
      { text: 'Estadísticas avanzadas',    included: false },
      { text: 'Reportes por sucursal',     included: false },
    ],
    cta: 'Empezar con Pro',
  },
  {
    name: 'Negocio',
    price: 790,
    usd: 88,
    description: 'Para cadenas y franquicias con múltiples locales.',
    highlight: false,
    limits: ['sucursales ilimitadas', 'cajeros ilimitados', 'productos ilimitados'],
    features: [
      { text: 'Todo lo del plan Pro',              included: true },
      { text: 'Control de inventario',             included: true },
      { text: 'Estadísticas avanzadas',            included: true },
      { text: 'Reportes comparativos por sucursal',included: true },
      { text: 'Sucursales y cajeros ilimitados',   included: true },
    ],
    cta: 'Contactar',
  },
];

/* ─── Mock POS ──────────────────────────────────────────── */
function MockPOS() {
  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden"
      style={{
        background: 'white',
        border: '1px solid oklch(0.91 0.008 252)',
        boxShadow: '0 32px 72px oklch(0.13 0.012 260 / 0.12), 0 8px 24px oklch(0.13 0.012 260 / 0.06)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'oklch(0.93 0.008 252)', background: 'oklch(0.975 0.006 252)' }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.65 0.22 28)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.73 0.16 85)' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: 'oklch(0.62 0.18 148)' }} />
        </div>
        <div className="flex-1 mx-4 rounded-md text-center text-xs py-0.5 px-3" style={{ background: 'oklch(0.93 0.008 252)', color: 'oklch(0.55 0.01 260)' }}>
          YankoPOS — Punto de Venta
        </div>
      </div>
      <div className="grid grid-cols-[56px_1fr_200px] h-72 sm:h-80">
        <div className="flex flex-col items-center py-4 gap-3 border-r" style={{ borderColor: 'oklch(0.93 0.008 252)', background: 'oklch(0.145 0.020 255)' }}>
          {[0,1,2,3].map((i) => (
            <div key={i} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: i===0?'oklch(0.47 0.17 234 / 0.25)':'transparent', border: i===0?'1px solid oklch(0.47 0.17 234 / 0.5)':'1px solid transparent' }}>
              <div className="w-4 h-4 rounded" style={{ background: i===0?'oklch(0.65 0.14 232)':'oklch(0.30 0.02 260)' }} />
            </div>
          ))}
        </div>
        <div className="p-3 overflow-hidden" style={{ background: 'oklch(0.985 0.006 250)' }}>
          <div className="flex gap-2 mb-3">
            {['Populares','Burgers','Bebidas','Extras'].map((cat,i) => (
              <div key={cat} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background:i===0?'oklch(0.47 0.17 234)':'white', color:i===0?'white':'oklch(0.55 0.01 260)', border:i===0?'none':'1px solid oklch(0.91 0.008 252)', fontSize:'10px' }}>
                {cat}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{name:'Classic Burger',price:'35'},{name:'BBQ Bacon',price:'42'},{name:'Veggie',price:'30'},{name:'Papas Fritas',price:'18'},{name:'Onion Rings',price:'20'},{name:'Coca-Cola',price:'12'}].map((p,i) => (
              <div key={i} className="rounded-xl p-2 flex flex-col gap-1" style={{ background:'white', border:'1px solid oklch(0.92 0.008 252)', boxShadow:'0 1px 3px oklch(0.13 0.012 260 / 0.06)' }}>
                <div className="w-full rounded-lg mb-1" style={{ height:'36px', background:`oklch(${0.88+i*0.015} 0.04 ${210+i*12})` }} />
                <p style={{ fontSize:'9px', color:'oklch(0.55 0.01 260)', lineHeight:'1.2' }}>{p.name}</p>
                <p style={{ fontSize:'10px', color:'oklch(0.47 0.17 234)', fontWeight:700 }}>Bs {p.price}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col border-l" style={{ borderColor:'oklch(0.91 0.008 252)', background:'white' }}>
          <div className="p-3 border-b" style={{ borderColor:'oklch(0.93 0.008 252)' }}>
            <p style={{ fontSize:'10px', color:'oklch(0.47 0.17 234)', fontWeight:600 }}>PEDIDO #14</p>
            <p style={{ fontSize:'9px', color:'oklch(0.62 0.008 260)', marginTop:'2px' }}>Mesa · Efectivo</p>
          </div>
          <div className="flex-1 p-3 flex flex-col gap-2">
            {[{name:'Classic Burger',qty:2,price:'70'},{name:'BBQ Bacon',qty:1,price:'42'},{name:'Coca-Cola',qty:2,price:'24'}].map((item,i) => (
              <div key={i} className="flex justify-between items-start" style={{ fontSize:'9px' }}>
                <div>
                  <p style={{ color:'oklch(0.25 0.012 260)' }}>{item.name}</p>
                  <p style={{ color:'oklch(0.62 0.008 260)' }}>×{item.qty}</p>
                </div>
                <p style={{ color:'oklch(0.47 0.17 234)', fontWeight:600 }}>Bs {item.price}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t" style={{ borderColor:'oklch(0.93 0.008 252)' }}>
            <div className="flex justify-between mb-2" style={{ fontSize:'10px' }}>
              <span style={{ color:'oklch(0.55 0.01 260)' }}>Total</span>
              <span style={{ color:'oklch(0.13 0.012 260)', fontWeight:700 }}>Bs 136</span>
            </div>
            <div className="w-full rounded-xl py-2 text-center font-semibold" style={{ background:'oklch(0.47 0.17 234)', color:'white', fontSize:'10px' }}>
              Confirmar pedido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing card ──────────────────────────────────────── */
function PlanCard({ plan }: { plan: Plan }) {
  const primary = 'oklch(0.47 0.17 234)';

  return (
    <div
      className="relative flex flex-col rounded-2xl p-7 transition-all duration-200"
      style={plan.highlight ? {
        background: 'white',
        border: `2px solid ${primary}`,
        boxShadow: `0 20px 60px oklch(0.47 0.17 234 / 0.15), 0 4px 16px oklch(0.47 0.17 234 / 0.10)`,
        transform: 'translateY(-6px)',
      } : {
        background: 'white',
        border: '1px solid oklch(0.91 0.008 252)',
        boxShadow: '0 2px 12px oklch(0.13 0.012 260 / 0.06)',
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
          style={{ background: primary, boxShadow: `0 4px 12px oklch(0.47 0.17 234 / 0.35)` }}
        >
          ⭐ {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <p className="font-heading font-black text-lg mb-1" style={{ color: 'oklch(0.13 0.012 260)' }}>
          {plan.name}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.55 0.010 260)' }}>
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1.5">
          <span className="font-heading font-black text-5xl leading-none" style={{ color: plan.highlight ? primary : 'oklch(0.13 0.012 260)' }}>
            {plan.price}
          </span>
          <div className="mb-1">
            <p className="text-sm font-bold" style={{ color: 'oklch(0.40 0.010 260)' }}>Bs</p>
            <p className="text-xs" style={{ color: 'oklch(0.65 0.008 260)' }}>/mes</p>
          </div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'oklch(0.68 0.008 260)' }}>
          ~${plan.usd} USD al tipo de cambio actual
        </p>
      </div>

      {/* Limits */}
      <div
        className="flex flex-wrap gap-1.5 mb-6 p-3 rounded-xl"
        style={{ background: plan.highlight ? 'oklch(0.97 0.013 225)' : 'oklch(0.975 0.006 252)' }}
      >
        {plan.limits.map((l) => (
          <span
            key={l}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{
              background: plan.highlight ? 'oklch(0.93 0.04 225)' : 'white',
              color: plan.highlight ? 'oklch(0.39 0.15 236)' : 'oklch(0.45 0.010 260)',
              border: plan.highlight ? '1px solid oklch(0.87 0.07 225)' : '1px solid oklch(0.91 0.008 252)',
            }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-7">
        {plan.features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            {f.included ? (
              <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.92 0.08 145)' }}>
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="oklch(0.45 0.18 148)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : (
              <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center" style={{ background: 'oklch(0.94 0.004 260)' }}>
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="oklch(0.70 0.008 260)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
            <span
              className="text-sm leading-snug"
              style={{ color: f.included ? 'oklch(0.25 0.012 260)' : 'oklch(0.68 0.008 260)' }}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to="/login"
        className="block text-center py-3 rounded-xl text-sm font-bold transition-all duration-150 active:scale-[0.98]"
        style={plan.highlight ? {
          background: primary,
          color: 'white',
          boxShadow: `0 4px 16px oklch(0.47 0.17 234 / 0.30)`,
        } : {
          background: 'oklch(0.975 0.006 252)',
          color: 'oklch(0.35 0.015 260)',
          border: '1px solid oklch(0.88 0.010 252)',
        }}
      >
        {plan.cta} →
      </Link>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white" style={{ color: 'oklch(0.13 0.012 260)' }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'oklch(1 0 0 / 0.92)', borderColor: 'oklch(0.92 0.008 252)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.47 0.17 234)' }}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <span className="font-heading font-black text-lg tracking-tight">
              Yanko<span style={{ color: 'oklch(0.47 0.17 234)' }}>POS</span>
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium" style={{ color: 'oklch(0.50 0.010 260)' }}>
            <a href="#features" className="hover:text-gray-900 transition-colors">Características</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Precios</a>
          </nav>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{ background: 'oklch(0.47 0.17 234)', color: 'white' }}
          >
            Acceder →
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-5 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: ['radial-gradient(900px 500px at 50% -10%, oklch(0.47 0.17 234 / 0.07) 0%, transparent 65%)', 'radial-gradient(600px 400px at 10% 80%, oklch(0.47 0.17 234 / 0.04) 0%, transparent 55%)'].join(',') }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, oklch(0.75 0.010 255) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 10%, transparent 75%)' }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-8 animate-fade" style={{ background: 'oklch(0.97 0.013 225)', borderColor: 'oklch(0.87 0.07 225)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: 'oklch(0.47 0.17 234)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.39 0.15 236)' }}>
              Software POS para restaurantes en Bolivia
            </span>
          </div>

          <h1 className="font-heading font-black leading-[1.05] tracking-tight mx-auto animate-slide stagger-1" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', maxWidth: '860px', color: 'oklch(0.10 0.015 260)' }}>
            Tu restaurante en{' '}
            <span style={{ color: 'oklch(0.47 0.17 234)' }}>ritmo de servicio</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed mx-auto animate-slide stagger-2" style={{ maxWidth: '500px', color: 'oklch(0.50 0.010 260)' }}>
            POS, cocina, caja y reportes — todo en una sola plataforma diseñada para operar a máxima velocidad.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide stagger-3">
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
              style={{ background: 'oklch(0.47 0.17 234)', color: 'white', boxShadow: '0 4px 20px oklch(0.47 0.17 234 / 0.35)' }}
            >
              Entrar al panel →
            </Link>
            <a
              href="#pricing"
              className="px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
              style={{ background: 'white', color: 'oklch(0.40 0.010 260)', border: '1px solid oklch(0.88 0.010 252)', boxShadow: '0 1px 4px oklch(0.13 0.012 260 / 0.07)' }}
            >
              Ver planes y precios
            </a>
          </div>

          <div className="hidden sm:block mt-16 animate-slide stagger-4">
            <MockPOS />
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="border-y" style={{ borderColor: 'oklch(0.92 0.008 252)', background: 'oklch(0.975 0.006 252)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-heading font-black text-3xl" style={{ color: 'oklch(0.47 0.17 234)' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.010 260)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: 'oklch(0.47 0.17 234)' }}>
              Todo lo que necesitas
            </p>
            <h2 className="font-heading font-black leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'oklch(0.10 0.015 260)' }}>
              Una plataforma completa,<br />nada de extras innecesarios
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl transition-all duration-200"
                style={{ background: 'oklch(0.985 0.006 250)', border: '1px solid oklch(0.91 0.008 252)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background='white'; el.style.borderColor='oklch(0.78 0.12 225)'; el.style.boxShadow='0 8px 28px oklch(0.13 0.012 260 / 0.08)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background='oklch(0.985 0.006 250)'; el.style.borderColor='oklch(0.91 0.008 252)'; el.style.boxShadow='none'; }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'oklch(0.93 0.03 225)', color: 'oklch(0.47 0.17 234)' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-base mb-2" style={{ color: 'oklch(0.13 0.012 260)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.52 0.010 260)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 sm:px-8" style={{ background: 'oklch(0.975 0.006 252)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: 'oklch(0.47 0.17 234)' }}>
              Planes y precios
            </p>
            <h2 className="font-heading font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'oklch(0.10 0.015 260)' }}>
              Paga solo lo que necesitas
            </h2>
            <p className="text-base mx-auto" style={{ maxWidth: '440px', color: 'oklch(0.52 0.010 260)' }}>
              Precios en bolivianos, sin contratos ni sorpresas. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pt-5">
            {PLANS.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>

          <p className="text-center text-xs mt-10" style={{ color: 'oklch(0.65 0.008 260)' }}>
            Tipo de cambio referencial: 1 USD ≈ 9 Bs · Los precios pueden ajustarse según variación del tipo de cambio
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-8 bg-white">
        <div className="max-w-4xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden" style={{ background: 'oklch(0.47 0.17 234)', boxShadow: '0 24px 60px oklch(0.47 0.17 234 / 0.30)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute pointer-events-none" style={{ inset:0, background:'radial-gradient(600px 400px at 70% 120%, oklch(0.30 0.12 250 / 0.5) 0%, transparent 60%)' }} />
          <div className="relative">
            <h2 className="font-heading font-black leading-tight mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'white' }}>
              ¿Listo para empezar?
            </h2>
            <p className="text-base mb-8 mx-auto" style={{ color: 'oklch(0.85 0.06 225)', maxWidth: '400px' }}>
              Accede a tu panel y empieza a gestionar tu restaurante hoy mismo.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200"
              style={{ background: 'white', color: 'oklch(0.35 0.15 234)', boxShadow: '0 4px 20px oklch(0.10 0.015 255 / 0.25)' }}
            >
              Acceder al panel
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t py-8 px-5 sm:px-8" style={{ borderColor: 'oklch(0.92 0.008 252)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'oklch(0.47 0.17 234)' }}>
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218" />
              </svg>
            </div>
            <span className="font-heading font-bold text-sm" style={{ color: 'oklch(0.55 0.010 260)' }}>YankoPOS</span>
          </div>
          <nav className="flex items-center gap-6 text-xs" style={{ color: 'oklch(0.65 0.008 260)' }}>
            <a href="#features" className="hover:text-gray-700 transition-colors">Características</a>
            <a href="#pricing" className="hover:text-gray-700 transition-colors">Precios</a>
            <Link to="/login" className="hover:text-gray-700 transition-colors">Acceder</Link>
          </nav>
          <p className="text-xs" style={{ color: 'oklch(0.65 0.008 260)' }}>
            © {new Date().getFullYear()} YankoPOS · Hecho en Bolivia
          </p>
        </div>
      </footer>
    </div>
  );
}
