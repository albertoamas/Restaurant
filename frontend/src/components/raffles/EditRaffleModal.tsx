import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { rafflesApi } from '../../api/raffles.api';
import { handleApiError } from '../../utils/api-error';
import { positionLabel } from '../../utils/raffle-utils';
import type { DetailRaffle } from './types';

interface Props {
  raffle: DetailRaffle;
  onClose: () => void;
  onUpdated: (updated: DetailRaffle) => void;
}

/**
 * Editar un sorteo existente: nombre, descripción y el texto de cada premio. Cómo se gana un
 * ticket y cuántos ganadores hay no cambian: afectaría los tickets ya emitidos.
 */
export function EditRaffleModal({ raffle, onClose, onUpdated }: Props) {
  const formId = useId();
  const [name, setName] = useState(raffle.name);
  const [description, setDescription] = useState(raffle.description ?? '');
  const [prizes, setPrizes] = useState(raffle.prizes.map((p) => ({ ...p })));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(raffle.name);
    setDescription(raffle.description ?? '');
    setPrizes(raffle.prizes.map((p) => ({ ...p })));
  }, [raffle.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameChanged        = name.trim() !== raffle.name;
  const descriptionChanged = description.trim() !== (raffle.description ?? '');
  const prizesChanged      = prizes.some((p, i) => p.prizeDescription !== raffle.prizes[i]?.prizeDescription);
  const isDirty            = nameChanged || descriptionChanged || prizesChanged;
  const valid              = name.trim() !== '' && prizes.every((p) => p.prizeDescription.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
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
      handleApiError(err, 'Error al actualizar el sorteo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={saving ? () => {} : onClose}
      title="Editar sorteo"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>Guardar cambios</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} required />
        <Textarea label="Descripción (opcional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />

        {prizes.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-label font-medium text-soft">Premio de cada lugar</legend>
            {prizes.map((prize, i) => (
              <Input
                key={prize.position}
                aria-label={`Premio del ${positionLabel(prize.position)}`}
                leftAddon={<span className="w-16 text-label">{positionLabel(prize.position)}</span>}
                value={prize.prizeDescription}
                maxLength={500}
                onChange={(e) => {
                  const next = [...prizes];
                  next[i] = { ...next[i], prizeDescription: e.target.value };
                  setPrizes(next);
                }}
              />
            ))}
          </fieldset>
        )}

        <p className="rounded-control border border-line bg-surface-2 px-3 py-2.5 text-label text-soft">
          Cómo se gana un ticket y cuántos ganadores hay no se pueden cambiar: afectaría los tickets ya emitidos.
        </p>
      </form>
    </Modal>
  );
}
