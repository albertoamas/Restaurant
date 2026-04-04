import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';

const salesBullets = [
	'Control de ventas en tiempo real',
	'Manejo de caja sin errores',
	'Reportes automaticos diarios',
];

const modules = [
	{ name: 'POS', detail: 'Cobro y pedidos por sucursal' },
	{ name: 'Kitchen', detail: 'Orden de preparacion en vivo' },
	{ name: 'Caja', detail: 'Apertura y cierre de turnos' },
	{ name: 'Reportes', detail: 'Lectura diaria de rendimiento' },
];

export function LandingPage() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-svh flex items-center justify-center bg-[oklch(0.972_0.006_252)]">
				<div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/pos" replace />;
	}

	return (
		<div className="min-h-svh relative overflow-hidden bg-[oklch(0.972_0.006_252)] text-gray-900">
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background: [
						'radial-gradient(1200px 520px at 0% 0%, oklch(0.74 0.15 85 / 0.16), transparent 62%)',
						'radial-gradient(1000px 520px at 100% 100%, oklch(0.60 0.15 148 / 0.10), transparent 60%)',
						'linear-gradient(140deg, oklch(0.99 0.004 252), oklch(0.955 0.012 248))',
					].join(','),
				}}
			/>

			<div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
				<header className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_28px_oklch(0.13_0.012_260/0.08)] p-4 sm:p-5 flex items-center justify-between gap-3">
					<div>
						<p className="font-heading font-black text-xl sm:text-2xl tracking-tight">VikunaPOS</p>
						<p className="text-xs sm:text-sm text-gray-500">Vende mas. Controla todo. Sin complicaciones.</p>
					</div>
					<div className="flex items-center gap-2">
						<Link
							to="/login"
							className="h-9 px-3 inline-flex items-center rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary-600 border border-primary-600 hover:bg-primary-700 hover:border-primary-700 transition-colors"
						>
							Ingresar
						</Link>
					</div>
				</header>

				<section className="grid lg:grid-cols-[1.08fr_0.92fr] gap-4 sm:gap-6">
					<article className="rounded-3xl overflow-hidden border border-white/70 shadow-[0_18px_44px_oklch(0.13_0.012_260/0.12)]">
						<div className="h-full p-6 sm:p-8 lg:p-10 bg-[linear-gradient(165deg,oklch(0.36_0.16_236)_0%,oklch(0.20_0.09_252)_100%)] text-white relative overflow-hidden">
							<div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border border-white/15" />
							<div className="absolute -bottom-20 -left-14 w-72 h-72 rounded-full bg-white/10" />

							<h1 className="relative font-heading font-black text-2xl sm:text-4xl leading-[1.02] tracking-tight max-w-xl">
								Control total de tu restaurante, en tiempo real.
							</h1>
							<p className="relative mt-4 text-sm sm:text-base text-white/80 max-w-md leading-relaxed">
								Gestiona ventas, pedidos y caja sin complicaciones.
							</p>

							<div className="relative mt-7">
								<Link
									to="/login"
									className="h-11 px-5 inline-flex items-center rounded-xl text-sm font-bold text-gray-900 bg-[oklch(0.88_0.10_100)] border border-white/10 hover:brightness-95 transition-all"
								>
									Empezar ahora
								</Link>
							</div>
						</div>
					</article>

					<aside className="rounded-3xl border border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_16px_38px_oklch(0.13_0.012_260/0.10)] p-5 sm:p-6">
						<p className="text-xs uppercase tracking-[0.16em] text-primary-700 font-bold">Modulos conectados</p>
						<h2 className="mt-2 font-heading font-black text-2xl sm:text-3xl tracking-tight leading-tight">
							Todo tu flujo en un solo panel.
						</h2>
						<p className="mt-2 text-sm text-gray-600 leading-relaxed">
							Disenado para restaurantes, snacks, cafeterias y dark kitchens.
						</p>

						<div className="mt-5 grid grid-cols-2 gap-3">
							{modules.map((module) => (
								<article
									key={module.name}
									className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.06)]"
								>
									<p className="text-xs font-bold uppercase tracking-wide text-gray-500">Modulo</p>
									<h3 className="mt-1 font-heading font-black text-lg text-gray-900">{module.name}</h3>
									<p className="mt-1 text-xs text-gray-600 leading-relaxed">{module.detail}</p>
								</article>
							))}
						</div>
					</aside>
				</section>

				<section className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-sm p-4 sm:p-5 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.07)]">
					<p className="text-xs uppercase tracking-[0.16em] text-primary-700 font-bold">Por que elegir VikunaPOS</p>
					<ul className="mt-3 grid sm:grid-cols-3 gap-3 sm:gap-4">
						{salesBullets.map((bullet) => (
							<li
								key={bullet}
								className="rounded-2xl border border-white/70 bg-white p-4 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.06)] text-sm font-semibold text-gray-800 flex items-start gap-2"
							>
								<span className="text-emerald-600 leading-none mt-0.5">✔</span>
								<span>{bullet}</span>
							</li>
						))}
					</ul>
				</section>

				<section className="rounded-2xl border border-white/70 bg-white/85 p-5 sm:p-6 shadow-[0_10px_30px_oklch(0.13_0.012_260/0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div>
						<h3 className="font-heading font-black text-2xl tracking-tight">Listo para arrancar con VikunaPOS?</h3>
						<p className="text-sm text-gray-600 mt-1">Empieza hoy con un panel pensado para operar rapido y con orden.</p>
					</div>
					<div className="flex items-center gap-2.5">
						<Link
							to="/login"
							className="h-10 px-4 inline-flex items-center rounded-xl text-sm font-bold text-white bg-primary-600 border border-primary-600 hover:bg-primary-700"
						>
							Ingresar
						</Link>
						<Link
							to="/admin"
							className="h-10 px-4 inline-flex items-center rounded-xl text-sm font-bold text-gray-700 border border-gray-300 bg-white hover:border-primary-400 hover:text-primary-800"
						>
							Admin
						</Link>
					</div>
				</section>

				<footer className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-sm p-4 sm:p-5 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div>
						<p className="font-heading font-black text-base text-gray-900">VikunaPOS</p>
						<p className="text-xs text-gray-500">Sistema de gestion para restaurantes y negocios gastronomicos.</p>
					</div>
					<div className="flex items-center gap-3 text-xs text-gray-500">
						<Link to="/login" className="hover:text-primary-800 transition-colors">Ingresar</Link>
						<Link to="/admin" className="hover:text-primary-800 transition-colors">Admin</Link>
						<span>© {new Date().getFullYear()} VikunaPOS</span>
					</div>
				</footer>
			</div>
		</div>
	);
}
