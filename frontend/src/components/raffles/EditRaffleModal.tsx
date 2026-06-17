import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { rafflesApi } from '../../api/raffles.api';
import { handleApiError } from '../../utils/api-error';
import type { DetailRaffle } from './types';

interface Props {
  raffle: DetailRaffle;
  onClose: () => void;
  onUpdated: (updated: DetailRaffle) => void;
}

export function EditRaffleModal({ raffle, onClose, onUpdated }: Props) {
  const [name, setName] = useState(raffle.name);
  const [description, setDescription] = useState(raffle.description ?? '');
  const [prizes, setPrizes] = useState(raffle.prizes.map((p) => ({ ...p })));
  const [saving, setSaving] = useState(false);

  // Sync if raffle prop changes (e.g. external update)
  useEffect(() => {
    setName(raffle.name);
    setDescription(raffle.description ?? '');
    setPrizes(raffle.prizes.map((p) => ({ ...p })));
  }, [raffle.id]);

  const nameChanged        = name.trim() !== raffle.name;
  const descriptionChanged = description.trim() !== (raffle.description ?? '');
  const prizesChanged      = prizes.some((p, i) => p.prizeDescription !== raffle.prizes[i]?.prizeDescription);
  const isDirty            = nameChanged || descriptionChanged || prizesChanged;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isDirty) { onClose(); return; }

    setSaving(true);
    try {
      const payload: { name?: string; description?: string; prizes?: { position: number; prizeDescription: string }[] } = {};
      if (nameChanged)        payload.name        = name.trim();
      if (descriptionChanged) payload.description = description.trim();
      if (prizesChanged)      payload.prizes      = prizes.filter((p, i) => p.prizeDescription !== raffle.prizes[i]?.prizeDescription);

      const updated = await rafflesApi.update(raffle.id, payload);
      onUpdated(updated as DetailRaffle);
      toast.success('Sorteo actualizado');
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al actualizar sorteo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} title="Editar sorteo" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            required
            className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 resize-none"
          />
        </div>

        {/* Premios */}
        {prizes.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Premios</label>
            <div className="space-y-2">
              {prizes.map((prize, i) => (
                <div key={prize.position} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-6 shrink-0 text-right">{prize.position}°</span>
                  <input
                    type="text"
                    value={prize.prizeDescription}
                    onChange={(e) => {
                      const next = [...prizes];
                      next[i] = { ...next[i], prizeDescription: e.target.value };
                      setPrizes(next);
                    }}
                    maxLength={500}
                    required
                    className="flex-1 px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Solo se puede cambiar el texto del premio. El número de premios y posiciones no se modifica.
            </p>
          </div>
        )}

        {/* Info de campos bloqueados */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-[11px] text-amber-600 leading-relaxed">
          El modo de tickets, monto acumulativo y número de ganadores <strong>no se pueden cambiar</strong> en un sorteo existente para no afectar los tickets ya generados.
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] rounded-xl transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
