import { useState } from 'react';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';
import { usersApi, type UserDto, type CreateCashierRequest } from '../api/users.api';
import type { BranchDto } from '@pos/shared';
import { UserRole } from '@pos/shared';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useUsers } from '../hooks/useUsers';
import { useBranches } from '../hooks/useBranches';

const ROLE_LABEL: Record<string, string> = { OWNER: 'Dueño', CASHIER: 'Cajero' };

function UserAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-[0_2px_6px_oklch(0.50_0.24_225/0.25)]"
      style={{ background: 'linear-gradient(135deg, oklch(0.70 0.18 225), oklch(0.50 0.24 225))' }}>
      <span className="text-sm font-bold text-white">{initial}</span>
    </div>
  );
}

export function TeamPage() {
  const { users, setUsers, loading: usersLoading } = useUsers();
  const { branches, loading: branchesLoading } = useBranches();
  const loading = usersLoading || branchesLoading;
  const activeBranches = branches.filter((b) => b.isActive);

  const [showModal, setShowModal] = useState(false);

  const handleToggle = async (user: UserDto) => {
    try {
      const updated = await usersApi.toggle(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u)));
      toast.success(updated.isActive ? 'Usuario activado' : 'Usuario desactivado');
    } catch (err) {
      handleApiError(err, 'Error al actualizar usuario');
    }
  };

  const handleBranchChange = async (user: UserDto, branchId: string | null) => {
    try {
      await usersApi.updateBranch(user.id, branchId);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, branchId } : u));
      toast.success('Sucursal actualizada');
    } catch (err) {
      handleApiError(err, 'Error al actualizar sucursal');
    }
  };

  const handleCreate = async (data: CreateCashierRequest) => {
    const created = await usersApi.create(data);
    setUsers((prev) => [...prev, { ...created, createdAt: new Date().toISOString() }]);
    setShowModal(false);
    toast.success('Cajero creado');
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-slide">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Equipo y Roles</h2>
            <p className="text-xs text-gray-500 mt-0.5">Gestiona cajeros, estado de cuenta y sucursal asignada.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              {users.length} usuarios
            </span>
            <Button onClick={() => setShowModal(true)}>+ Agregar cajero</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] divide-y divide-gray-50 overflow-hidden">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between px-4 py-4 gap-3 transition-colors hover:bg-gray-50/60 ${
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
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700
                      focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                      max-w-[140px] transition-[border-color,box-shadow] bg-white"
                  >
                    <option value="">Sin sucursal</option>
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
                {user.role !== 'OWNER' && (
                  <Toggle checked={user.isActive} onChange={() => handleToggle(user)} />
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
    </div>
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
                focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500 transition-[border-color,box-shadow]"
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
