import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
import { useBranchSelector } from '../../hooks/useBranchSelector';
import { BranchSelector } from './BranchSelector';
import { useNavGroups } from './nav';
import { Icon } from '../ui/Icon';
import { InstallAppMenuItem } from '../pwa/InstallAppMenuItem';

/*
 * Piezas del menú lateral, compartidas por el Sidebar de escritorio y el menú móvil para que
 * los dos muestren exactamente lo mismo.
 */

/* ── Marca del negocio + sucursal ──────────────────────────────────────────── */

export function NavBrand({ collapsed = false, trailing }: { collapsed?: boolean; trailing?: ReactNode }) {
  const { user, currentBranchId } = useAuth();
  const branchSelector = useBranchSelector();

  const logo = (
    <div className="w-9 h-9 rounded-control bg-primary-500 flex items-center justify-center shrink-0">
      <Icon name="cart" size={18} strokeWidth={2} className="text-white" />
    </div>
  );

  if (collapsed) return <div className="flex justify-center py-4 border-b border-line">{logo}</div>;

  return (
    <div className="px-4 pt-4 pb-4 border-b border-line space-y-3">
      <div className="flex items-center gap-3">
        {logo}
        <p className="flex-1 min-w-0 text-body font-semibold text-main font-heading truncate">
          {user?.tenantName || 'Mi negocio'}
        </p>
        {trailing}
      </div>
      {user?.role === 'OWNER' && (
        <div className="relative">
          <BranchSelector
            branches={branchSelector.branches}
            currentBranch={branchSelector.currentBranch}
            currentBranchId={currentBranchId}
            isOpen={branchSelector.isOpen}
            canSelect={branchSelector.canSelect}
            onToggle={branchSelector.toggle}
            onSelect={branchSelector.select}
          />
        </div>
      )}
      {user?.role === 'CASHIER' && user.branchId && (
        <div className="flex items-center gap-2 min-h-9 px-3 rounded-control bg-surface-2 border border-line text-label text-soft">
          <Icon name="map-pin" size={14} strokeWidth={2} className="shrink-0 text-muted" />
          <span className="truncate">Sucursal asignada</span>
        </div>
      )}
    </div>
  );
}

/* ── Navegación ────────────────────────────────────────────────────────────── */

export function NavList({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const groups = useNavGroups();

  return (
    <nav aria-label="Menú principal" className={`flex-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
      {groups.filter((g) => g.length > 0).map((group, gi) => (
        <div key={gi} className={gi > 0 ? 'mt-3 pt-3 border-t border-line' : ''}>
          <ul className="space-y-0.5">
            {group.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={({ isActive }) => [
                    'relative flex items-center min-h-10 rounded-control text-body transition-colors duration-150',
                    collapsed ? 'justify-center' : 'gap-3 px-3',
                    isActive
                      ? 'bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold'
                      : 'text-soft hover:text-main hover:bg-surface-2 font-medium',
                  ].join(' ')}
                >
                  <Icon name={item.icon} size={19} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ── Menú de usuario ───────────────────────────────────────────────────────── */

export function UserMenu({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const close = () => { setOpen(false); onNavigate?.(); };
  const initial = (user?.name ?? '?')[0].toUpperCase();
  const itemClass = 'flex items-center gap-2.5 w-full min-h-10 px-3 text-body transition-colors';

  return (
    <div ref={ref} className={`relative border-t border-line py-3 ${collapsed ? 'px-2' : 'px-3'}`}>
      {open && (
        <div
          role="menu"
          className={`absolute bottom-full mb-1 ${collapsed ? 'left-2 w-56' : 'left-3 right-3'} rounded-card overflow-hidden border border-line bg-surface-card shadow-floating animate-slide-down z-50`}
        >
          <InstallAppMenuItem onSelect={close} />
          <button role="menuitem" onClick={() => { close(); navigate('/account'); }} className={`${itemClass} text-soft hover:text-main hover:bg-surface-2`}>
            <Icon name="user-circle" size={16} className="shrink-0" />
            Mi cuenta
          </button>
          <div className="h-px bg-line mx-3" />
          <button role="menuitem" onClick={() => { close(); logout(); }} className={`${itemClass} text-red-700 dark:text-red-400 hover:bg-red-500/10`}>
            <Icon name="logout" size={16} className="shrink-0" />
            Cerrar sesión
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={collapsed ? `Menú de ${user?.name ?? 'usuario'}` : undefined}
        title={collapsed ? user?.name : undefined}
        className={`flex items-center w-full rounded-control hover:bg-surface-2 transition-colors ${collapsed ? 'justify-center p-1.5' : 'gap-3 px-2 py-1.5'}`}
      >
        <span className="w-8 h-8 rounded-full bg-surface-3 border border-line flex items-center justify-center shrink-0 text-label font-bold text-main">
          {initial}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-label font-semibold text-main truncate">{user?.name}</span>
              <span className="block text-caption text-muted truncate">{user?.email}</span>
            </span>
            <Icon name="chevron-up" size={14} strokeWidth={2} className={`text-muted shrink-0 transition-transform ${open ? '' : 'rotate-180'}`} />
          </>
        )}
      </button>
    </div>
  );
}
