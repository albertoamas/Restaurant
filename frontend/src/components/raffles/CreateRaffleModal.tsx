import { useState, useId } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { chipClass } from '../ui/filter-chip';
import { Input, Textarea } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { rafflesApi } from '../../api/raffles.api';
import { useCategories } from '../../hooks/useCategories';
import { handleApiError } from '../../utils/api-error';
import type { CreateRaffleRequest, RaffleDto } from '@pos/shared';

import { positionLabel } from '../../utils/raffle-utils';

type NewRaffleMode = CreateRaffleRequest['ticketMode'];

export function CreateRaffleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: RaffleDto) => void }) {
  const [ticketMode, setTicketMode] = useState<NewRaffleMode>('CATEGORY_MATCH');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [spendingThreshold, setSpendingThreshold] = useState<number>(100);
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [prizes, setPrizes] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);
  const { categories, loading: loadingCategories } = useCategories();
  const formId = useId();

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleWinnersChange(n: number) {
    const count = Math.max(1, Math.min(10, n));
    setNumberOfWinners(count);
    setPrizes((prev) => {
      const next = [...prev];
      while (next.length < count) next.push('');
      return next.slice(0, count);
    });
  }

  function handlePrizeChange(index: number, value: string) {
    setPrizes((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  const modeValid =
    ticketMode === 'CATEGORY_MATCH'
      ? categoryIds.length > 0
      : spendingThreshold >= 1;

  const isValid =
    name.trim() !== '' &&
    modeValid &&
    numberOfWinners >= 1 &&
    prizes.length === numberOfWinners &&
    prizes.every((p) => p.trim() !== '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    try {
      const raffle = await rafflesApi.create({
        name: name.trim(),
        ticketMode,
        categoryIds: ticketMode === 'CATEGORY_MATCH' ? categoryIds : undefined,
        spendingThreshold: ticketMode === 'SPENDING_THRESHOLD' ? spendingThreshold : undefined,
        description: description.trim() || undefined,
        numberOfWinners,
        prizes: prizes.map((p, i) => ({ position: i + 1, prizeDescription: p.trim() })),
      });
      onCreated(raffle);
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al crear sorteo');
    } finally {
      setSaving(false);
    }
  }

  const prizeHint = ['Ej.: celular', 'Ej.: cena para dos', 'Ej.: vale de consumo'];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Nuevo sorteo"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!isValid}>Crear sorteo</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <Input label="Nombre del sorteo" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Sorteo de Navidad" required />

        <div>
          <p className="mb-1.5 text-label font-medium text-soft">Cómo se gana un ticket</p>
          <SegmentedControl
            label="Cómo se gana un ticket"
            fullWidth
            value={ticketMode}
            onChange={setTicketMode}
            options={[
              { value: 'CATEGORY_MATCH', label: 'Comprando de categorías' },
              { value: 'SPENDING_THRESHOLD', label: 'Por monto consumido' },
            ]}
          />
        </div>

        {ticketMode === 'CATEGORY_MATCH' ? (
          <fieldset>
            <legend className="mb-1.5 text-label font-medium text-soft">Categorías del sorteo</legend>
            {loadingCategories ? (
              <p className="text-label text-soft">Cargando categorías...</p>
            ) : categories.length === 0 ? (
              <p className="text-label text-soft">Primero crea una categoría en Productos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={categoryIds.includes(c.id)}
                    onClick={() => toggleCategory(c.id)}
                    className={chipClass(categoryIds.includes(c.id))}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <p className="mt-1.5 text-caption text-muted">
              Cada unidad que un cliente asignado compre de estas categorías le da un ticket.
            </p>
          </fieldset>
        ) : (
          <Input
            label="Un ticket cada"
            type="number"
            inputMode="numeric"
            min={1}
            leftAddon="Bs"
            value={spendingThreshold}
            onChange={(e) => setSpendingThreshold(Math.max(1, Math.floor(Number(e.target.value))))}
            hint="El consumo de cada cliente se acumula; cada vez que pasa este monto, recibe un ticket."
          />
        )}

        <Input
          label="Cuántos ganadores"
          type="number"
          inputMode="numeric"
          min={1}
          max={10}
          value={numberOfWinners}
          onChange={(e) => handleWinnersChange(Number(e.target.value))}
          hint="Hasta 10. Se sortean del último lugar al primero."
        />

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-label font-medium text-soft">Premio de cada lugar</legend>
          {prizes.map((prize, i) => (
            <Input
              key={i}
              aria-label={`Premio del ${positionLabel(i + 1)}`}
              leftAddon={<span className="w-16 text-label">{positionLabel(i + 1)}</span>}
              value={prize}
              onChange={(e) => handlePrizeChange(i, e.target.value)}
              placeholder={prizeHint[i] ?? 'Ej.: premio sorpresa'}
            />
          ))}
        </fieldset>

        <Textarea label="Descripción (opcional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bases o detalles para tus clientes" />
      </form>
    </Modal>
  );
}
