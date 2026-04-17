import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { rafflesApi } from '../../api/raffles.api';
import { productsApi } from '../../api/products.api';
import { handleApiError } from '../../utils/api-error';
import type { RaffleDto, ProductDto } from '@pos/shared';

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white transition-[border-color,box-shadow]';
const labelCls = 'text-xs font-semibold text-gray-600 mb-1.5 block';

export function CreateRaffleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (r: RaffleDto) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productsApi.getAll({ includeInactive: false, limit: 200 }).then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !productId) return;
    setSaving(true);
    try {
      const raffle = await rafflesApi.create({
        name: name.trim(),
        productId,
        description: description.trim() || undefined,
        prizeDescription: prizeDescription.trim() || undefined,
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
          <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sorteo de Navidad" className={inputCls} />
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
          <label className={labelCls}>Premio</label>
          <input type="text" value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)}
            placeholder="Ej: Televisor 55 pulgadas" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales..." rows={2}
            className={`${inputCls} resize-none`} />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="primary" fullWidth onClick={handleSubmit} loading={saving}
            disabled={!name.trim() || !productId}>
            Crear sorteo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
