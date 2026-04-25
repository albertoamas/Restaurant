import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';
import { branchesApi } from '../api/branches.api';
import type { BranchDto } from '@pos/shared';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Spinner } from '../components/ui/Spinner';
import { useBranches } from '../hooks/useBranches';

export function BranchesPage() {
  const { branches, setBranches, loading } = useBranches();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BranchDto | null>(null);

  const handleToggle = async (branch: BranchDto) => {
    try {
      const updated = await branchesApi.toggle(branch.id);
      setBranches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      toast.success(updated.isActive ? 'Sucursal activada' : 'Sucursal desactivada');
    } catch (err) {
      handleApiError(err, 'Error al actualizar sucursal');
    }
  };

  const handleSaved = (branch: BranchDto) => {
    setBranches((prev) => {
      const idx = prev.findIndex((b) => b.id === branch.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = branch; return next;
      }
      return [...prev, branch];
    });
    setShowModal(false);
    setEditing(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-slide">
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Sucursales</h2>
            <p className="text-xs text-gray-500 mt-0.5">Organiza locales, estado y datos de contacto.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              {branches.length} sucursales
            </span>
            <Button onClick={() => { setEditing(null); setShowModal(true); }}>+ Nueva sucursal</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-sm shadow-[0_6px_20px_oklch(0.13_0.012_260/0.06)]">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm font-semibold text-gray-500">Sin sucursales</p>
          <p className="text-xs mt-1">Crea tu primera sucursal</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] divide-y divide-gray-50 overflow-hidden">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={[
                'flex items-center justify-between px-4 py-4 gap-4 transition-colors hover:bg-gray-50/60',
                'border-l-4',
                branch.isActive ? 'border-l-emerald-400' : 'border-l-gray-200',
                !branch.isActive ? 'opacity-60' : '',
              ].join(' ')}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900 truncate">{branch.name}</p>
                </div>
                {branch.address && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate ml-5">{branch.address}</p>
                )}
                {branch.phone && (
                  <p className="text-xs text-gray-400 ml-5">{branch.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={branch.isActive ? 'success' : 'neutral'} dot>
                  {branch.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
                <button
                  onClick={() => { setEditing(branch); setShowModal(true); }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  Editar
                </button>
                <Toggle checked={branch.isActive} onChange={() => handleToggle(branch)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <BranchModal
        isOpen={showModal}
        branch={editing}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}

function BranchModal({
  isOpen, branch, onClose, onSaved,
}: {
  isOpen: boolean;
  branch: BranchDto | null;
  onClose: () => void;
  onSaved: (b: BranchDto) => void;
}) {
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (branch) {
      setForm({ name: branch.name, address: branch.address ?? '', phone: branch.phone ?? '' });
    } else {
      setForm({ name: '', address: '', phone: '' });
    }
    setError('');
  }, [branch, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { name: form.name, address: form.address || undefined, phone: form.phone || undefined };
      const saved = branch
        ? await branchesApi.update(branch.id, payload)
        : await branchesApi.create(payload);
      onSaved(saved);
      toast.success(branch ? 'Sucursal actualizada' : 'Sucursal creada');
    } catch (err) {
      handleApiError(err, 'Error al guardar sucursal');
      setError('Error al guardar sucursal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={branch ? 'Editar sucursal' : 'Nueva sucursal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre de la sucursal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Dirección (opcional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Teléfono (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={loading}>
            {branch ? 'Guardar cambios' : 'Crear sucursal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
