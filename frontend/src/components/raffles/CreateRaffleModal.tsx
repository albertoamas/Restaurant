import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { rafflesApi } from '../../api/raffles.api';
import { productsApi } from '../../api/products.api';
import { handleApiError } from '../../utils/api-error';
import type { RaffleDto, ProductDto } from '@pos/shared';

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white transition-[border-color,box-shadow]';
const labelCls = 'text-xs font-semibold text-gray-600 mb-1.5 block';

function ordinalLabel(n: number): string {
  if (n === 1) return '1er lugar';
  if (n === 2) return '2do lugar';
  if (n === 3) return '3er lugar';
  return `${n}° lugar`;
}

export function CreateRaffleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: RaffleDto) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productId, setProductId] = useState('');
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [prizes, setPrizes] = useState<string[]>(['']);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productsApi.getAll({ includeInactive: false, limit: 200 })
      .then((r) => setProducts(r.data))
      .catch((err) => handleApiError(err, 'Error al cargar productos'));
  }, []);

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

  const isValid =
    name.trim() !== '' &&
    productId !== '' &&
    numberOfWinners >= 1 &&
    prizes.length === numberOfWinners &&
    prizes.every((p) => p.trim() !== '');

  async function handleSubmit() {
    if (!isValid) return;
    setSaving(true);
    try {
      const raffle = await rafflesApi.create({
        name: name.trim(),
        productId,
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

  return (
    <Modal isOpen onClose={onClose} title="Nuevo Sorteo" size="sm">
      <div className="space-y-3.5">
        <div>
          <label className={labelCls}>Nombre del sorteo *</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sorteo de Navidad"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Producto que activa el sorteo *</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
            <option value="">Seleccionar producto</option>
            {products.filter((p) => p.isActive).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
            Cada pedido con este producto y un cliente asignado genera un ticket automáticamente.
          </p>
        </div>

        <div>
          <label className={labelCls}>Número de ganadores *</label>
          <input
            type="number"
            min={1}
            max={10}
            value={numberOfWinners}
            onChange={(e) => handleWinnersChange(Number(e.target.value))}
            className={inputCls}
          />
          <p className="text-[11px] text-gray-400 mt-1.5">
            Define cuántos lugares se sortearán (del último al primero).
          </p>
        </div>

        <div>
          <label className={labelCls}>Premios por posición *</label>
          <div className="space-y-2">
            {prizes.map((prize, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 w-16 shrink-0 text-right">
                  {ordinalLabel(i + 1)}
                </span>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => handlePrizeChange(i, e.target.value)}
                  placeholder={i === 0 ? 'Ej: Celular Samsung' : i === 1 ? 'Ej: Televisor 55"' : 'Ej: Bicicleta'}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales..."
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={saving} disabled={!isValid}>
            Crear sorteo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
