import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole, isUnlimited } from '@pos/shared';
import { usersApi, type UserDto } from '../api/users.api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { Skeleton } from '../components/ui/Skeleton';
import { CashierSheet } from '../components/team/CashierSheet';
import { CashierFormModal } from '../components/team/CashierForms';
import { NewPasswordModal } from '../components/ui/NewPasswordModal';
import { useUsers } from '../hooks/useUsers';
import { useBranches, useBranchNames } from '../hooks/useBranches';
import { useSettingsStore } from '../store/settings.store';
import { queryKeys } from '../lib/query-keys';
import { handleApiError } from '../utils/api-error';
import { Notice } from '../components/ui/Notice';
import { Avatar } from '../components/ui/Avatar';


type Pending =
  | { kind: 'branch'; user: UserDto; branchId: string | null }
  | { kind: 'toggle'; user: UserDto };

export function TeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { users, loading: usersLoading } = useUsers();
  const { branches, loading: branchesLoading } = useBranches();
  const { branchName } = useBranchNames();
  const maxCashiers = useSettingsStore((s) => s.planLimits?.maxCashiers);
  const loading = usersLoading || branchesLoading;
  const activeBranches = branches.filter((b) => b.isActive);

  const owners   = users.filter((u) => u.role === UserRole.OWNER);
  const cashiers = users.filter((u) => u.role !== UserRole.OWNER)
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, 'es'));
  // El plan cuenta solo los cajeros activos.
  const activeCashiers = cashiers.filter((u) => u.isActive).length;
  const limited = maxCashiers !== undefined && !isUnlimited(maxCashiers);
  const full = limited && activeCashiers >= (maxCashiers as number);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm]             = useState<{ open: boolean; user: UserDto | null }>({ open: false, user: null });
  const [passwordFor, setPasswordFor] = useState<UserDto | null>(null);
  const [pending, setPending]       = useState<Pending | null>(null);
  const [busy, setBusy]             = useState(false);
  const selected = cashiers.find((u) => u.id === selectedId) ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.users });

  const confirmPending = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === 'branch') {
        await usersApi.updateBranch(pending.user.id, pending.branchId);
        toast.success(`${pending.user.name} ahora vende en ${branchName(pending.branchId) ?? 'ninguna sucursal'}`);
      } else {
        const updated = await usersApi.toggle(pending.user.id);
        toast.success(updated.isActive ? `${pending.user.name} puede volver a iniciar sesión` : `${pending.user.name} ya no puede iniciar sesión`);
      }
      setPending(null);
      invalidate();
    } catch (err) {
      handleApiError(err, 'Error al actualizar el cajero');
    } finally {
      setBusy(false);
    }
  };

  const saveCashier = async (data: { name: string; email: string; password?: string; branchId?: string }) => {
    try {
      if (form.user) {
        await usersApi.update(form.user.id, { name: data.name, email: data.email });
        toast.success('Cajero actualizado');
      } else {
        await usersApi.create({ name: data.name, email: data.email, password: data.password ?? '', branchId: data.branchId });
        toast.success(`${data.name} agregado al equipo`);
      }
      setForm({ open: false, user: null });
      invalidate();
    } catch (err) {
      handleApiError(err, form.user ? 'Error al actualizar el cajero' : 'Error al crear el cajero');
    }
  };

  const resetPassword = async (newPassword: string) => {
    if (!passwordFor) return;
    try {
      await usersApi.resetPassword(passwordFor.id, newPassword);
      toast.success(`Contraseña de ${passwordFor.name} cambiada`);
      setPasswordFor(null);
    } catch (err) {
      handleApiError(err, 'Error al cambiar la contraseña');
    }
  };

  const pendingTitle = !pending ? ''
    : pending.kind === 'branch' ? `Mover a ${pending.user.name} a ${branchName(pending.branchId) ?? 'sin sucursal'}`
    : pending.user.isActive ? `Desactivar a ${pending.user.name}` : `Activar a ${pending.user.name}`;
  const pendingMessage = !pending ? ''
    : pending.kind === 'branch'
      ? (pending.branchId ? 'Desde su próximo pedido vende y cobra en esa sucursal, aunque esté en pleno turno.' : 'No podrá vender hasta que le asignes una sucursal.')
    : pending.user.isActive ? 'No podrá iniciar sesión ni vender. Sus ventas pasadas se conservan y puedes volver a activarlo.'
    : 'Puede volver a iniciar sesión con su contraseña.';

  return (
    <PageShell>
      <PageHeader
        title="Equipo"
        description={limited ? `${activeCashiers} de ${maxCashiers} cajeros activos de tu plan.` : `${activeCashiers} cajeros activos.`}
        actions={
          <Button onClick={() => setForm({ open: true, user: null })} disabled={full}>
            <Icon name="plus" size={18} />
            Nuevo cajero
          </Button>
        }
      >
        {full && (
          <Notice>Llegaste al máximo de {maxCashiers} cajeros activos de tu plan. Desactiva a quien ya no trabaja para agregar a otro.</Notice>
        )}
      </PageHeader>

      {loading ? (
        <div className="space-y-3"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : (
        <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
          <ul className="divide-y divide-line">
            {owners.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={u.name} tone="brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-main">{u.name}</p>
                  <p className="truncate text-caption text-muted">Dueño. {u.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>Mi cuenta</Button>
              </li>
            ))}
            {cashiers.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(u.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
                >
                  <Avatar name={u.name} />
                  <div className={`min-w-0 flex-1 ${u.isActive ? '' : 'opacity-60'}`}>
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-body font-semibold text-main">{u.name}</p>
                      {u.isActive ? <Badge variant="success" dot>Activo</Badge> : <Badge dot>Inactivo</Badge>}
                    </div>
                    <p className="truncate text-caption text-muted">
                      Cajero. {u.branchId ? branchName(u.branchId) ?? 'Sucursal' : 'Sin sucursal'}. {u.email}
                    </p>
                  </div>
                  <Icon name="chevron-right" size={16} className="shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
          {cashiers.length === 0 && (
            <div className="border-t border-line">
              <EmptyState compact icon="team" title="Todavía no tienes cajeros" description="Crea uno para que venda con su propia cuenta." />
            </div>
          )}
        </section>
      )}

      {selected && (
        <CashierSheet
          user={selected}
          branches={activeBranches}
          onClose={() => setSelectedId(null)}
          onBranch={(branchId) => { if (branchId !== selected.branchId) setPending({ kind: 'branch', user: selected, branchId }); }}
          onEdit={() => { setForm({ open: true, user: selected }); setSelectedId(null); }}
          onPassword={() => { setPasswordFor(selected); setSelectedId(null); }}
          onToggle={() => setPending({ kind: 'toggle', user: selected })}
        />
      )}

      {form.open && (
        <CashierFormModal user={form.user} branches={activeBranches} onClose={() => setForm({ open: false, user: null })} onSubmit={saveCashier} />
      )}
      {passwordFor && <NewPasswordModal name={passwordFor.name} onClose={() => setPasswordFor(null)} onSubmit={resetPassword} />}

      <ConfirmModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={confirmPending}
        loading={busy}
        variant={pending?.kind === 'toggle' && pending.user.isActive ? 'danger' : 'primary'}
        title={pendingTitle}
        message={pendingMessage}
        confirmLabel={pending?.kind === 'branch' ? 'Mover' : pending?.user.isActive ? 'Desactivar' : 'Activar'}
        cancelLabel="Volver"
      />
    </PageShell>
  );
}
