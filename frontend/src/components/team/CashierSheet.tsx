import type { BranchDto } from '@pos/shared';
import type { UserDto } from '../../api/users.api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Input';
import { formatBoliviaDayMonth } from '../../utils/date';

/**
 * Ficha del cajero: dónde trabaja y lo que el dueño puede hacer con su cuenta. Reemplaza los
 * cuatro controles sueltos de cada fila (sucursal, editar, contraseña e interruptor).
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
    <Modal
      isOpen
      onClose={onClose}
      title={user.name}
      size="sm"
      footer={
        <Button variant={user.isActive ? 'secondary' : 'primary'} fullWidth onClick={onToggle}>
          <Icon name={user.isActive ? 'ban' : 'check'} size={18} />
          {user.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 truncate text-body text-soft">{user.email}</p>
          {user.isActive ? <Badge variant="success" dot>Activo</Badge> : <Badge>Inactivo</Badge>}
        </div>

        {branches.length > 0 && (
          <Select
            label="Sucursal donde vende"
            value={user.branchId ?? ''}
            onChange={(e) => onBranch(e.target.value || null)}
            hint="Se pide confirmar: el cambio vale desde su próximo pedido."
          >
            <option value="">Sin sucursal</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={onEdit}>
            <Icon name="edit" size={18} />
            Editar nombre y correo
          </Button>
          <Button variant="secondary" onClick={onPassword}>
            <Icon name="lock" size={18} />
            Cambiar contraseña
          </Button>
        </div>

        <p className="text-caption text-muted">En el equipo desde el {formatBoliviaDayMonth(user.createdAt)}.</p>
      </div>
    </Modal>
  );
}
