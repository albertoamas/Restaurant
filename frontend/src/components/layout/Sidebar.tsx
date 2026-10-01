import { Icon } from '../ui/Icon';
import { NavBrand, NavList, UserMenu } from './NavParts';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Menú lateral de escritorio (lg+). En pantallas menores lo reemplaza el menú móvil. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      data-print-hide
      className={`hidden lg:flex lg:flex-col ${collapsed ? 'w-16' : 'w-60'} h-screen fixed left-0 top-0 border-r border-line bg-surface-sidebar transition-[width] duration-200 z-30`}
    >
      <NavBrand collapsed={collapsed} />
      <NavList collapsed={collapsed} />

      <div className={`${collapsed ? 'px-2' : 'px-3'} pb-1`}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          title={collapsed ? 'Expandir menú' : undefined}
          className={`flex items-center w-full min-h-9 rounded-control text-label text-muted hover:text-main hover:bg-surface-2 transition-colors ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
        >
          <Icon name="sidebar" size={17} className="shrink-0" />
          {!collapsed && 'Contraer menú'}
        </button>
      </div>

      <UserMenu collapsed={collapsed} />
    </aside>
  );
}
