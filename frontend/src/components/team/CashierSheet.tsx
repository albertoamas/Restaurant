import type { ReactNode } from 'react';
import type { BranchDto } from '@pos/shared';
import type { UserDto } from '../../api/users.api';
import { Badge } from '../ui/Badge';
import { Icon, type IconName } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Input';
import { formatBoliviaDayMonth } from '../../utils/date';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-label font-semibold text-soft">{title}</h3>
      {children}
    </section>
  );
}

/** Fila de acción con ícono, título y explicación: se lee qué hace antes de tocarla. */
function ActionRow({ icon, title, description, onClick, danger = false }: {
  icon: IconName; title: string; description: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${
        danger ? 'bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-surface-2 text-soft'
      }`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-body font-semibold ${danger ? 'text-red-700 dark:text-red-400' : 'text-main'}`}>{title}</span>
        <span className="block text-label text-soft">{description}</span>
      </span>
      <Icon name="chevron-right" size={16} className="shrink-0 text-muted" />
    </button>
  );
}

/**
 * Ficha del cajero: quién es, dónde vende y lo que el dueño puede hacer con su cuenta. Reemplaza
 * los cuatro controles sueltos de cada fila (sucursal, editar, contraseña e interruptor).
 */
export function CashierSheet({ user, branches, onClose, onBranch, onEdit, onPassword, onToggle }: {
  user: UserDto;
  branches: BranchDto[];
  onClose: () => void;
  /** Pide cambiar de sucursal (se confirma en la página). */
  onBranch: (branchId: string | null) => void;
  onEdit: () => void;
  onPassword: () => void;
  onToggle: () => void;
}) {
  return (
    <Modal isOpen onClose={onClose} title="Cajero" size="md">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-heading text-title font-bold text-soft">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-heading font-semibold text-main">{user.name}</p>
              {user.isActive ? <Badge variant="success" dot>Activo</Badge> : <Badge dot>Inactivo</Badge>}
            </div>
            <p className="truncate text-body text-soft">{user.email}</p>
            <p className="text-caption text-muted">En el equipo desde el {formatBoliviaDayMonth(user.createdAt)}</p>
          </div>
        </div>

        {branches.length > 0 && (
          <Section title="Dónde vende">
            <Select
              aria-label="Sucursal donde vende"
              value={user.branchId ?? ''}
              onChange={(e) => onBranch(e.target.value || null)}
              hint="Al cambiarla se pide confirmar: vale desde su próximo pedido."
            >
              <option value="">Sin sucursal</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Section>
        )}

        <Section title="Cuenta">
          <div className="overflow-hidden rounded-card border border-line divide-y divide-line">
            <ActionRow icon="edit" title="Editar datos" description="Nombre y correo con el que inicia sesión." onClick={onEdit} />
            <ActionRow icon="lock" title="Cambiar contraseña" description="Por ejemplo, si la olvidó. La anterior deja de funcionar." onClick={onPassword} />
            {user.isActive ? (
              <ActionRow icon="ban" title="Desactivar cuenta" description="No podrá iniciar sesión. Sus ventas se conservan." onClick={onToggle} danger />
            ) : (
              <ActionRow icon="check" title="Activar cuenta" description="Vuelve a poder iniciar sesión y vender." onClick={onToggle} />
            )}
          </div>
        </Section>
      </div>
    </Modal>
  );
}
