import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { BranchDto } from '@pos/shared';
import type { UserDto } from '../../api/users.api';
import { cashSessionApi } from '../../api/cash-session.api';
import { ActionList, ActionRow, SheetSection } from '../ui/ActionRow';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { queryKeys } from '../../lib/query-keys';
import { formatBoliviaDayMonth, formatBoliviaTime } from '../../utils/date';
import { Avatar } from '../ui/Avatar';

/**
 * Ficha de la sucursal: sus datos, quién vende ahí y si su caja está abierta. Lo último es justo
 * lo que impide desactivarla, así que la ficha lo explica antes en vez de dejar fallar el intento.
 */
export function BranchSheet({ branch, cashiers, canActivate, maxBranches, onClose, onEdit, onToggle }: {
  branch: BranchDto;
  /** Cajeros activos asignados a esta sucursal. */
  cashiers: UserDto[];
  /** Hay cupo en el plan para una sucursal activa más. */
  canActivate: boolean;
  maxBranches?: number;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const { data: cash, isPending: cashLoading } = useQuery({
    queryKey: queryKeys.cashSessionCurrent(branch.id),
    queryFn:  () => cashSessionApi.getCurrent(branch.id),
    enabled:  branch.isActive,
    staleTime: 0,
  });
  const cashOpen = branch.isActive && !!cash;
  const contact = [branch.address, branch.phone].filter(Boolean);

  const blockReason = !branch.isActive ? null
    : cashLoading ? 'Revisando la caja.'
    : cashOpen ? 'Tiene la caja abierta: ciérrala primero.'
    : cashiers.length > 0 ? `Tiene ${cashiers.length === 1 ? '1 cajero asignado' : `${cashiers.length} cajeros asignados`}: muévelos a otra sucursal primero.`
    : null;

  return (
    <Modal isOpen onClose={onClose} title="Sucursal" size="md">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card border border-line bg-surface-2 text-soft">
            <Icon name="building" size={24} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 truncate text-heading font-semibold text-main">{branch.name}</p>
              {branch.isActive ? <Badge variant="success" dot>Activa</Badge> : <Badge dot>Inactiva</Badge>}
            </div>
            {contact.length > 0
              ? contact.map((line) => <p key={line} className="truncate text-body text-soft">{line}</p>)
              : <p className="text-body text-muted">Sin dirección ni teléfono</p>}
            <p className="text-caption text-muted">Creada el {formatBoliviaDayMonth(branch.createdAt)}</p>
          </div>
        </div>

        <SheetSection title="Quién vende aquí">
          {cashiers.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-dashed border-line px-4 py-3">
              <p className="text-label text-soft">Ningún cajero asignado.</p>
              {branch.isActive && <Button variant="ghost" size="sm" onClick={() => navigate('/team')}>Ir a Equipo</Button>}
            </div>
          ) : (
            <ul className="overflow-hidden rounded-card border border-line divide-y divide-line">
              {cashiers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={u.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-semibold text-main">{u.name}</span>
                    <span className="block truncate text-caption text-muted">{u.email}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SheetSection>

        {branch.isActive && (
          <SheetSection title="Caja">
            {cashLoading ? (
              <Skeleton variant="text" />
            ) : (
              <div className="flex items-center gap-3 rounded-card border border-line px-4 py-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cashOpen ? 'bg-emerald-500' : 'bg-line-strong'}`} aria-hidden />
                <p className="text-body text-main">
                  {cash ? (
                    <>
                      Abierta el {formatBoliviaDayMonth(cash.openedAt)} a las {formatBoliviaTime(cash.openedAt)}
                      {cash.openedByName && <span className="text-soft"> por {cash.openedByName}</span>}
                    </>
                  ) : 'Cerrada'}
                </p>
              </div>
            )}
          </SheetSection>
        )}

        <SheetSection title="Sucursal">
          <ActionList>
            <ActionRow icon="edit" title="Editar datos" description="Nombre, dirección y teléfono." onClick={onEdit} />
            {branch.isActive ? (
              <ActionRow
                icon="ban"
                title="Desactivar sucursal"
                description={blockReason ?? 'Deja de aparecer para vender. Sus ventas y reportes se conservan.'}
                onClick={onToggle}
                danger
                disabled={blockReason !== null}
              />
            ) : (
              <ActionRow
                icon="check"
                title="Activar sucursal"
                description={canActivate ? 'Vuelve a aparecer para vender y abrir caja.' : `Llegaste al máximo de ${maxBranches} sucursales activas de tu plan.`}
                onClick={onToggle}
                disabled={!canActivate}
              />
            )}
          </ActionList>
        </SheetSection>
      </div>
    </Modal>
  );
}
