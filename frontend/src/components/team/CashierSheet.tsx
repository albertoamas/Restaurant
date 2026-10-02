import type { BranchDto } from '@pos/shared';
import type { UserDto } from '../../api/users.api';
import { ActionList, ActionRow, SheetSection } from '../ui/ActionRow';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Input';
import { formatBoliviaDayMonth } from '../../utils/date';
import { Avatar } from '../ui/Avatar';

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
          <Avatar name={user.name} size="lg" />
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
          <SheetSection title="Dónde vende">
            <Select
              aria-label="Sucursal donde vende"
              value={user.branchId ?? ''}
              onChange={(e) => onBranch(e.target.value || null)}
              hint="Al cambiarla se pide confirmar: vale desde su próximo pedido."
            >
              <option value="">Sin sucursal</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </SheetSection>
        )}

        <SheetSection title="Cuenta">
          <ActionList>
            <ActionRow icon="edit" title="Editar datos" description="Nombre y correo con el que inicia sesión." onClick={onEdit} />
            <ActionRow icon="lock" title="Cambiar contraseña" description="Por ejemplo, si la olvidó. La anterior deja de funcionar." onClick={onPassword} />
            {user.isActive ? (
              <ActionRow icon="ban" title="Desactivar cuenta" description="No podrá iniciar sesión. Sus ventas se conservan." onClick={onToggle} danger />
            ) : (
              <ActionRow icon="check" title="Activar cuenta" description="Vuelve a poder iniciar sesión y vender." onClick={onToggle} />
            )}
          </ActionList>
        </SheetSection>
      </div>
    </Modal>
  );
}
