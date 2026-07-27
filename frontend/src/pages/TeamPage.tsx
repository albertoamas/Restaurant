import { useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { handleApiError } from '../utils/api-error';
import { usersApi, type UserDto, type CreateCashierRequest, type UpdateCashierRequest } from '../api/users.api';
import type { BranchDto } from '@pos/shared';
import { UserRole } from '@pos/shared';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageShell } from '../components/ui/PageShell';
import { Input } from '../components/ui/Input';
import { useUsers } from '../hooks/useUsers';
import { useBranches } from '../hooks/useBranches';
import { queryKeys } from '../lib/query-keys';

const ROLE_LABEL: Record<string, string> = { OWNER: 'Dueño', CASHIER: 'Cajero' };

function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-[0_2px_6px_oklch(0.60_0.22_42/0.35)]"
      style={{ background: 'linear-gradient(135deg, oklch(0.68 0.20 42), oklch(0.55 0.22 40))' }}>
      <span className="text-sm font-bold text-white">{initial}</span>
    </div>
  );
}

export function TeamPage() {
  const queryClient = useQueryClient();
  const { users, loading: usersLoading } = useUsers();
  const { branches, loading: branchesLoading } = useBranches();
  const loading = usersLoading || branchesLoading;
  const activeBranches = branches.filter((b) => b.isActive);

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);
  const [resetPwUser, setResetPwUser] = useState<UserDto | null>(null);

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: queryKeys.users });

  const handleToggle = async (user: UserDto) => {
    try {
      const updated = await usersApi.toggle(user.id);
      toast.success(updated.isActive ? 'Usuario activado' : 'Usuario desactivado');
      invalidateUsers();
    } catch (err) {
      handleApiError(err, 'Error al actualizar usuario');
    }
  };

  const handleBranchChange = async (user: UserDto, branchId: string | null) => {
    try {
      await usersApi.updateBranch(user.id, branchId);
      toast.success('Sucursal actualizada');
      invalidateUsers();
    } catch (err) {
      handleApiError(err, 'Error al actualizar sucursal');
    }
  };

  const handleCreate = async (data: CreateCashierRequest) => {
    await usersApi.create(data);
    setShowModal(false);
    toast.success('Cajero creado');
    invalidateUsers();
  };

  const handleEdit = async (data: UpdateCashierRequest) => {
    if (!editUser) return;
    try {
      await usersApi.update(editUser.id, data);
      setEditUser(null);
      toast.success('Cajero actualizado');
      invalidateUsers();
    } catch (err) {
      handleApiError(err, 'Error al actualizar cajero');
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetPwUser) return;
    try {
      await usersApi.resetPassword(resetPwUser.id, newPassword);
      setResetPwUser(null);
      toast.success('Contraseña reseteada');
    } catch (err) {
      handleApiError(err, 'Error al resetear contraseña');
    }
  };

  return (
    <PageShell>
      <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-xl p-4 sm:p-5 mb-6" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Equipo y Roles</h2>
            <p className="text-xs text-gray-500 mt-0.5">Gestiona cajeros, estado de cuenta y sucursal asignada.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 border border-primary-500/20 text-primary-600">
              {users.length} usuarios
            </span>
            <Button onClick={() => setShowModal(true)}>+ Agregar cajero</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-md divide-y divide-[var(--border-subtle)] overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between px-4 py-4 gap-3 transition-colors hover:bg-[var(--color-surface-2)] ${
                !user.isActive && user.role !== UserRole.OWNER ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar name={user.name} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={user.role === UserRole.OWNER ? 'info' : 'neutral'} dot>
                  {ROLE_LABEL[user.role]}
                </Badge>
                {user.role !== 'OWNER' && activeBranches.length > 0 && (
                  <select
                    value={user.branchId ?? ''}
                    onChange={(e) => handleBranchChange(user, e.target.value || null)}
                    className="text-xs border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-gray-700
                      focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50
                      max-w-[140px] transition-[border-color,box-shadow] bg-[var(--color-surface-card)]"
                  >
                    <option value="">Sin sucursal</option>
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
                {user.role !== 'OWNER' && (
                  <>
                    <button
                      onClick={() => setEditUser(user)}
                      title="Editar cajero"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setResetPwUser(user)}
                      title="Resetear contraseña"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" />
                      </svg>
                    </button>
                    <Toggle checked={user.isActive} onChange={() => handleToggle(user)} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateCashierModal
        isOpen={showModal}
        branches={activeBranches}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />

      {editUser && (
        <EditCashierModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSubmit={handleEdit}
        />
      )}

      {resetPwUser && (
        <ResetPasswordModal
          userName={resetPwUser.name}
          onClose={() => setResetPwUser(null)}
          onSubmit={handleResetPassword}
        />
      )}
    </PageShell>
  );
}

function EditCashierModal({
  user, onClose, onSubmit,
}: {
  user: UserDto;
  onClose: () => void;
  onSubmit: (data: UpdateCashierRequest) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: user.name, email: user.email });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name: form.name.trim(), email: form.email.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar cajero">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          minLength={2}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={loading}>Guardar cambios</Button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({
  userName, onClose, onSubmit,
}: {
  userName: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(newPassword);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Resetear contraseña — ${userName}`}>
      <p className="text-sm text-gray-500 mb-4">
        Asigna una nueva contraseña temporal. Comunícala al cajero por el canal que prefieras.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
          minLength={6}
          required
          autoFocus
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          minLength={6}
          required
        />
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={loading}>Resetear contraseña</Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateCashierModal({
  isOpen, branches, onClose, onSubmit,
}: {
  isOpen: boolean;
  branches: BranchDto[];
  onClose: () => void;
  onSubmit: (data: CreateCashierRequest) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', branchId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: CreateCashierRequest = {
        name: form.name,
        email: form.email,
        password: form.password,
        branchId: form.branchId || undefined,
      };
      await onSubmit(payload);
      setForm({ name: '', email: '', password: '', branchId: '' });
    } catch (err) {
      handleApiError(err, 'Error al crear cajero');
      setError('Error al crear cajero');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Cajero">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {branches.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sucursal asignada
              <span className="ml-1 text-xs font-normal text-gray-400">(puede asignarse después)</span>
            </label>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className="w-full border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm bg-[var(--color-surface-card)] text-gray-700
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]"
            >
              <option value="">Sin sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={loading}>Crear cajero</Button>
        </div>
      </form>
    </Modal>
  );
}
